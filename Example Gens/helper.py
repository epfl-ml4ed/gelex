import re
from typing import List, Tuple, Set, FrozenSet, Generator, Any, Dict, Literal
import pandas as pd
import itertools
import openai
from gensim.parsing.preprocessing import preprocess_string

class Choice:
    index: int
    message: Dict[Literal['role', 'content'], str]
    finish_reason: Literal['stop', 'timeout', 'length', 'incomplete', 'error']

    def __init__(self, choice: Dict[str, Any]):
        self.index = choice['index']
        self.message = choice['message']
        self.finish_reason = choice['finish_reason']

class GptResponse:
    id: str
    object: str
    created: int
    model: str
    choices: List[Choice]
    usage: Dict[Literal['prompt_tokens', 'completion_tokens', 'total_tokens'], int]
    
    def __init__(self, response: Dict[str, Any]):
        self.id = response['id']
        self.object = response['object']
        self.created = response['created']
        self.model = response['model']
        self.choices = [Choice(choice) for choice in response['choices']]
        self.usage = response['usage']


openai.api_key = "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"

def load_required_data(DATA_DIR):
    print('Starting to load rule data')
    # import rules csv
    rules = pd.read_csv(f'{DATA_DIR}/rules_recipe_scale.csv')
    # From the antecedents column, convert from frozenset to list of strings
    rules['antecedents'] = rules['antecedents'].apply(lambda x: list(eval(x)))
    print('Rule data loaded...')
    print()
    from tqdm import tqdm
    from collections import defaultdict

    print('Starting rule extraction...')
    print('\t -> Starting to sort rules by lift')
    # Sort by lift and grab the first 400 rules
    extracted_rules = rules.sort_values('lift', ascending=False)
    extracted_rule_list = extracted_rules['antecedents'].tolist()
    extracted_rule_list.sort()
    extracted_rule_list = list(k for k,_ in itertools.groupby(extracted_rule_list))
    # sort the extracted rules by length of antecedents, largest to smallest
    extracted_rule_list.sort(key=lambda x: len(x), reverse=True)
    print('\t -> Done sorting rules...')
    print('_'*30)

    print('\t -> Starting RegEx pattern creation')
    # Initialize the list to store the regex patterns
    to_be_joined = []

    # Iterate through each rule in the extracted_rule_list
    for rule in extracted_rule_list:
        # Check the length of the rule
        if len(rule) == 1:
            # If there's only one ingredient in the rule, escape it and append it
            to_be_joined.append(re.escape(rule[0]))
        else:
            # If there are multiple ingredients, create permutations and join them with '.*'
            for permutation in itertools.permutations(rule):
                pattern = '.*'.join([re.escape(ingredient) for ingredient in permutation])
                to_be_joined.append(pattern)

    to_be_joined = [x for x in to_be_joined if x]
    print('\t -> Done creating RegEx patterns...')

    return rules, to_be_joined, extracted_rules

def find_patterns(sample_recipe, to_be_joined):
    # preprocess recipe
    # Apply all the patterns in the be joined list
    set_to_return = set()
    for pattern in to_be_joined:
        # Compile the pattern
        match = re.search(pattern, ' '.join(sample_recipe))
        if match:
            # extract the words from the pattern
            # The pattern is of the form word.*word so we split on .*
            matched_words = pattern.split('.*')
            # remove the empty strings
            matched_words = [word for word in matched_words if word]
            # add the matched words to the recipe_matches
            set_to_add = frozenset(matched_words)
            set_to_return.add(set_to_add)
    return set_to_return


def extract_rules(
    recipe: List[str],
    rules: pd.DataFrame,
    rule_count = 3
) -> Set[FrozenSet[str]]:
    """
        This function takes as input a recipe, then iterates over the rules row by row,
        checks if the antecedents are in the recipe, if yes it adds the row to a list to be returned.
        The function breaks after it has found the required number of rules.

        Input: 
            - recipe: A list of tokens (i.e. a recipe preprocessed using gensim preprocess_string)
            - rules: A pd.DataFrame with columns: ['antecedents', 'consequents', 'confidence', 'lift'], should be sorted by lift.
            - rule_count: The number of rules to be extracted

        Output:
            - Two elements:
                - A set of frozensets, each frozenset is a rule.
                - A dictionary with the rules as keys and the tuple (consequents, lift) as values.
    """

    # Initialize the list to be returned
    rules_to_return = set()
    suggestions_to_return = dict()
    already_suggested = set()
    # Iterate over the rules
    for row_count, row in rules.iterrows():
        # Check if the antecedents are in the recipe
        antecedents = set(row['antecedents'])
        # Check if the antecedents are in the recipe
        if antecedents.issubset(set(recipe)):
            # Add the row to the list to be returned
            # Make sure the consequents are NOT in the recipe
            # print(f"antecedents: {antecedents}, consequents: {row['consequents']}")
            consequents = set(eval(row['consequents']))
            # print(f"antecedents: {antecedents}, consequents: {consequents}, recipe:{set(recipe)}", not consequents.issubset(set(recipe)), frozenset(row['consequents']) not in already_suggested)
            if not consequents.issubset(set(recipe)) and frozenset(row['consequents']) not in already_suggested:
                # We already have a suggestion with a higher lift
                if frozenset(row['antecedents']) in suggestions_to_return:
                    continue
                # print("got in!")
                # Add the rule to the list
                rules_to_return.add(frozenset(row['antecedents']))
                # Add the suggestion to the dictionary
                suggestions_to_return[frozenset(row['antecedents'])] = (row['consequents'], row['lift'])
                already_suggested.add(frozenset(row['consequents']))
                # print(f"rules_to_return: {rules_to_return}")
            # print('______')
        # Break if we have found the required number of rules
        if len(rules_to_return) == rule_count:
            break
    return rules_to_return, suggestions_to_return

def _create_prompt(title, directions, fulfilled_rules, suggestions):
    advices = [x[0] for x in suggestions.values()]
    return f"""
    The below recipe is for {title}. 
    The original directions are as follows:
    ({' '.join(directions)})
    Some of the rules that are fulfilled by this recipe are:
    {fulfilled_rules}
    The new rules to be fulfilled are:
    {advices}
    """

def create_prompt(title, directions, fulfilled_rules, suggestions):
    # list is a list of strings, we want to convert it to following string:
    # 1. index0
    # 2. index1
    # ...
    directions = '\n'.join([f'{i+1}. {x}' for i, x in enumerate(directions)])
    advices = [x[0] for x in suggestions.values()]
    return f"""
    Recipe:
    {directions}
    Some of the fulfilled rules are:
    {fulfilled_rules}
    The new rules to be fulfilled are:
    {advices}
    """

def create_fewshot_prompt(title, directions, fulfilled_rules, suggestions):
    advices = [x[0] for x in suggestions.values()]
    return f"""
    <OLD RECIPE>
    {directions}
    </OLD RECIPE>
    <FULFILLED RULES>
    {fulfilled_rules}
    </FULFILLED RULES>
    <RULES TO FULFILL>
    {advices}
    </RULES TO FULFILL>

    Answer:
    """

def prompt_gpt(
        prompt: str,
        print_response: bool = True,
        model="gpt-3.5-turbo",
) -> GptResponse:
    """
        This function takes as input a prompt and returns the response from GPT-3.5.

        Inputs:
            - prompt: The prompt to be sent to GPT-3.5.
            - print_response: Whether to print the response or not.

        Output:
            - The response from GPT-3.5.
    """
    response = openai.ChatCompletion.create(
        model=model,
        messages = [
            {
            "role": "system", "content": """
            You are a cooking assistant. 
            User will give you directions and the title of a recipe along with some rules that it has already fulfilled.
            The rules will be of following shape: frozenset({{'word1', 'word2', ...}}) -> This means that the words word1, word2, ... should be present somewhere in the recipe.
            The user will also give you some new set of rules that it has not fulfilled yet.
            Your job is to rewrite the recipe while keeping the following in mind:
            1. Only change or add something in order to fulfill the new rules given by the user.
            2. Make sure the fulfill all of the new rules. 
            3. Do NOT ever add anything new unless it directly helps you fulfill the new rules.
            4. Never ever remove any details(such as the temperature or time) or steps from the original instructions.
            5. 
            Give your new recipe between <RECIPE> and </RECIPE> tags.
            After you have created the recipe, write between <EXPLANATION> and </EXPLANATION> tags why you made the changes you made.
            """
            },
            {
            "role": "user", "content": prompt
            }
        ],
        temperature=0,
    )
    if print_response:
        # convert response to GptResponse
        response = GptResponse(response)
        _print_response(response)
    return response

def prompt_gpt_2(
        prompt: str,
        print_response: bool = True,
        model="gpt-3.5-turbo",
) -> GptResponse:
    """
        A really similar function to prompt_gpt, but we try a different system prompt.
        See the documentation for prompt_gpt for more details.
    """
    response = openai.ChatCompletion.create(
        model=model,
        messages = [
            {
            "role": "system", "content": """
            You are a professor at a culinary school and you are teaching a class on how to write recipes.
            You will be given a recipe and a set of rules that it has already fulfilled. Note that this will just be a subset of all the rules that the recipe fulfills.
            The rules will be of following shape: frozenset({{'word1', 'word2', ...}}) -> This means that the words word1, word2, ... should be present somewhere in the recipe.
            The student will also give you some new set of rules that it has not fulfilled yet.
            You are responsible for rewriting the recipe. You have to make sure that the new recipe you write fulfills all the new rules, while keeping all the details from the original recipe intact.
            Thus, you are to only add upon the original recipe, and avoid removing anything from it. You are to only add something if it directly helps you fulfill the new rules.
            Rewrite the recipe with the new steps you added and wrap it between <RECIPE> and </RECIPE> tags.
            After writing the recipe, write between <EXPLANATION> and </EXPLANATION> tags why you made the changes you made.
            So the output format is:
            <RECIPE>
            Your new recipe here
            </RECIPE>
            <EXPLANATION>
            Your explanation here
            </EXPLANATION>
            """
            },
            {
            "role": "user", "content": prompt
            }
        ],
        temperature=0,
    )
    if print_response:
        # convert response to GptResponse
        response = GptResponse(response)
        _print_response(response)
    return response

def prompt_gpt_3(
        prompt: str,
        print_response: bool = True,
        model="gpt-3.5-turbo",
) -> GptResponse:
    """
        A really similar function to prompt_gpt, but we try a different system prompt.
        See the documentation for prompt_gpt for more details.
    """
    response = openai.ChatCompletion.create(
        model=model,
        messages = [
            {
            "role": "system", "content": """
            You are a recipe improvement assistant. The improvement will be done ONLY in the scope of rules.
            You will be givzen a recipe and a set of rules that it has already fulfilled. Note that this will just be a subset of all the rules that the recipe fulfills.
            The rules will be of following shape: frozenset({{'word1', 'word2', ...}}) -> This means that the words word1, word2, ... should be present somewhere in the recipe.
            The user will also give you some new set of rules that it has not fulfilled yet.
            
            You are responsible for rewriting the recipe. You have to make sure that the new recipe you write fulfills all the new rules, while keeping all the details from the original recipe intact.
            Thus, you are to only add upon the original recipe, and avoid removing anything from it. You are to only add something if it directly helps you fulfill the new rules.
            
            You'll write two parts, the first part is the Ingredients and Instructions. The second part is the explanation.
            The first part will be wrapped between <RECIPE> and </RECIPE> tags. In this part include the ingredient portions in the list labelled Ingredients: and then the Instructions section as a numbered list
            
            The second part will be wrapped between <EXPLANATION> and </EXPLANATION> tags. In this part, explain why you made the changes you made.
            
            So the output format is:
            <RECIPE>
            Ingredients:
            - Ingredient 1
            - Ingredient 2
            ...
            Instructions:
            1. Step 1
            2. Step 2
            ...
            </RECIPE>
            <EXPLANATION>
            Your explanation here
            </EXPLANATION>
            """
            },
            {
            "role": "user", "content": prompt
            }
        ],
        temperature=0,
    )
    if print_response:
        # convert response to GptResponse
        response = GptResponse(response)
        _print_response(response)
    return response

def prompt_gpt_3_extra_info(
        prompt: str,
        print_response: bool = True,
        model="gpt-3.5-turbo",
) -> GptResponse:
    """
    A really similar function to prompt_gpt, but we try a different system prompt.
    See the documentation for prompt_gpt for more details.
    """
    response = openai.ChatCompletion.create(
        model=model,
        messages = [
            {
            "role": "system", "content": """
            You are a recipe improvement assistant. The improvement will be done ONLY in the scope of rules.
            You will be givzen a recipe and a set of rules that it has already fulfilled. Note that this will just be a subset of all the rules that the recipe fulfills.
            The rules will be of following shape: frozenset({{'word1', 'word2', ...}}) -> This means that the words word1, word2, ... should be present somewhere in the recipe. Note that, these words aren't dependent on each other. Thus they don't have to appear in the same sentence, or in the same order that they are given. It just means they have to appear at least once somewhere in the recipe.
            The user will also give you some new set of rules that it has not fulfilled yet.
            
            You are responsible for rewriting the recipe. You have to make sure that the new recipe you write fulfills all the new rules, while keeping all the details from the original recipe intact.
            Thus, you are to only add upon the original recipe, and avoid removing anything from it. You are to only add something if it directly helps you fulfill the new rules.
            
            You'll write two parts, the first part is the Ingredients and Instructions. The second part is the explanation.
            The first part will be wrapped between <RECIPE> and </RECIPE> tags. In this part include the ingredient portions in the list labelled Ingredients: and then the Instructions section as a numbered list
            
            The second part will be wrapped between <EXPLANATION> and </EXPLANATION> tags. In this part, explain why you made the changes you made.
            
            So the output format is:
            <RECIPE>
            Ingredients:
            - Ingredient 1
            - Ingredient 2
            ...
            Instructions:
            1. Step 1
            2. Step 2
            ...
            </RECIPE>
            <EXPLANATION>
            Your explanation here
            </EXPLANATION>
            """
            },
            {
            "role": "user", "content": prompt
            }
        ],
        temperature=0,
    )
    if print_response:
        # convert response to GptResponse
        response = GptResponse(response)
        _print_response(response)
    return response

def prompt_gpt_short(
    prompt: str,
    print_response: bool = True,
    model="gpt-3.5-turbo",
) -> GptResponse:
    response = openai.ChatCompletion.create(
    model=model,
    messages = [
        {
        "role": "system", "content": """
        You are a recipe improvement assistant.
        You will be given 3 things:
        1. A recipe
        2. A set of rules that it has already fulfilled.
        3. A set of rules that it has not fulfilled yet.

        The rules will be of following shape: frozenset({{'word1', 'word2', ...}}) -> This means that the words word1, word2, ... should be present somewhere in the recipe. 
        
        You'll write two parts:
        1. The first part is the Ingredients and Instructions. First write the ingredients in a list labelled Ingredients:
        Then in the label Instructions: write the new recipe by fulfilling all of the new rules, while changing as little as possible from the original recipe. Write the instructions as a numbered list.
        Wrap this part between <RECIPE> and </RECIPE> tags.
        2. The second part is the explanation part. In here write all the changes you have made and why made them. Wrap this part between <EXPLANATION> and </EXPLANATION> tags.
        
        So the output format is:
        <RECIPE>
        Ingredients:
        - Ingredient 1
        - Ingredient 2
        ...
        Instructions:
        1. Step 1
        2. Step 2
        ...
        </RECIPE>
        <EXPLANATION>
        Your explanation here
        </EXPLANATION>
        """
        },
        {
        "role": "user", "content": prompt
        }
    ],
    temperature=0,
    )
    if print_response:
        # convert response to GptResponse
        response = GptResponse(response)
        _print_response(response)
    return response

def prompt_gpt_short_extra_info(
    prompt: str,
    print_response: bool = True,
    model="gpt-3.5-turbo",
) -> GptResponse:
    response = openai.ChatCompletion.create(
    model=model,
    messages = [
        {
        "role": "system", "content": """
        You are a recipe improvement assistant.
        You will be given 3 things:
        1. A recipe
        2. A set of rules that it has already fulfilled.
        3. A set of rules that it has not fulfilled yet.

        The rules will be of following shape: frozenset({{'word1', 'word2', ...}}) -> This means that the words word1, word2, ... should be present somewhere in the recipe. Note that, these words aren't dependent on each other. Thus they words don't have to appear in the same sentence, or in the same order that they are given. It just means they have to appear at least once somewhere in the recipe.
        
        You'll write two parts:
        1. The first part is the Ingredients and Instructions. First write the ingredients in a list labelled Ingredients:
        Then in the label Instructions: write the new recipe by fulfilling all of the new rules, while changing as little as possible from the original recipe. Write the instructions as a numbered list.
        Wrap this part between <RECIPE> and </RECIPE> tags.
        2. The second part is the explanation part. In here write all the changes you have made and why made them. Wrap this part between <EXPLANATION> and </EXPLANATION> tags.
        
        So the output format is:
        <RECIPE>
        Ingredients:
        - Ingredient 1
        - Ingredient 2
        ...
        Instructions:
        1. Step 1
        2. Step 2
        ...
        </RECIPE>
        <EXPLANATION>
        Your explanation here
        </EXPLANATION>
        """
        },
        {
        "role": "user", "content": prompt
        }
    ],
    temperature=0,
    )
    if print_response:
        # convert response to GptResponse
        response = GptResponse(response)
        _print_response(response)
    return response

def prompt_few_shot(
    prompt: str,
    print_response: bool = True,
    model="gpt-3.5-turbo",
) -> GptResponse:
    # Read the examples from few_shots_gend_by_gp4.txt
    with open('./few_shots_gend_by_gpt4.txt', 'r') as f:
        examples = f.read()
        response = openai.ChatCompletion.create(
        model=model,
        messages = [
            {
            "role": "user", "content": f"""
            {examples}
            {prompt}
            """
            }
        ],
        temperature=0,
        )
        if print_response:
            # convert response to GptResponse
            response = GptResponse(response)
            _print_response(response)
        return response
        

def calculate_similarity(
    original_recipe: str,
    gpt_response: GptResponse
) -> Tuple[float, float]:
    """
        This function takes as input two recipes and calculates the similarity between them.
        This is done by checking how many tokens of the new recipe are in the original recipe.

        Inputs:
            - original recipe: A list of tokens, i.e., it's a recipe preprocessed by gensim preprocess_string.
            - new recipe: The prompt generated by prompt_gpt function.
        
        Output:
            - Original in new: The percentage of tokens in the original recipe that are in the new recipe.
            - New in original: The percentage of tokens in the new recipe that are in the original recipe.
    """

    # First grab from the first choice the message
    new_recipe = gpt_response.choices[0].message.content
    # The recipe written by chat gpt should be between <RECIPE> and </RECIPE> tags
    # Split on the tags and grab the second element
    new_recipe = new_recipe.split('<RECIPE>')[1].split('</RECIPE>')[0]
    # Split the recipe into tokens
    new_recipe = preprocess_string(new_recipe)
    # Calculate the similarity
    return(
        len(set(original_recipe).intersection(set(new_recipe))) / len(set(original_recipe)),
        len(set(new_recipe).intersection(set(original_recipe))) / len(set(new_recipe))
    )


def _print_response(response: GptResponse|str) -> None:
        # if type is GptResponse
        if type(response) == GptResponse:
            # Grab the first choice
            response_str = response.choices[0].message.content
        elif type(response) == str:
            response_str = response
        else:
            print(type(response))
            raise TypeError(f'response should be of type GptResponse or str, but got {type(response)}')
        new_recipe = response_str.split('<RECIPE>')[1].split('</RECIPE>')[0]
        print('New recipe:')
        print(new_recipe)
        print()
        print('________')
        print('Explanation:')
        explanation = response_str.split('<EXPLANATION>')[1].split('</EXPLANATION>')[0]
        print(explanation)
        print()

def _return_response_str(response: GptResponse|str) -> str:
    # if type is GptResponse
    if type(response) == GptResponse:
        # Grab the first choice
        response_str = response.choices[0].message.content
    elif type(response) == str:
        response_str = response
    else:
        print(type(response))
        raise TypeError(f'response should be of type GptResponse or str, but got {type(response)}')
    str_to_return = ""
    new_recipe = response_str.split('<RECIPE>')[1].split('</RECIPE>')[0]
    str_to_return += 'New recipe:\n'
    str_to_return += new_recipe
    str_to_return += '\n'
    str_to_return += '________\n'
    str_to_return += 'Explanation:\n'
    explanation = response_str.split('<EXPLANATION>')[1].split('</EXPLANATION>')[0]
    str_to_return += explanation
    str_to_return += '\n'
    return str_to_return

def complete_pipeline(
        recipe_row: pd.Series,
        extracted_rules: pd.DataFrame,
        prompt_function: callable = prompt_gpt_2,
        model="gpt-3.5-turbo"
) -> Dict[str, any]:
    
    """
        This function represents the whole pipeline.

        Inputs:
            - recipe_row: A pandas dataframe row with a column called 'preprocessed' which is a list of tokens. Note: we assume this preprocessed column is created using gensim preprocess_string.
            - extracted_rules: A pandas dataframe with columns ['antecedents', 'consequents', 'confidence', 'lift'] sorted by lift.
            - prompt_function: The function to be used to send the prompt to GPT-3.5. The default is prompt_gpt_2.
        
        Output:
            - A dictionary with the following keys:
                - index: The index of the recipe in the dataframe.
                - original_recipe: The original recipe.
                - new_recipe: The new recipe generated by GPT-3.5.
                - original_in_new: The percentage of tokens in the original recipe that are in the new recipe.
                - new_in_original: The percentage of tokens in the new recipe that are in the original recipe.
    """

    # Generate the prompt
    fulfilled_rules, suggestions = extract_rules(recipe_row['preprocessed'], extracted_rules)
    # if the prompt function is prompt_few_shot, we need to create a different prompt
    if prompt_function == prompt_few_shot:
        prompt = create_fewshot_prompt(recipe_row['title'], recipe_row['directions'], fulfilled_rules, suggestions)
    else:
        prompt = create_prompt(recipe_row['title'], recipe_row['directions'], fulfilled_rules, suggestions)
    # Send the prompt to GPT
    resp = prompt_function(prompt=prompt, print_response=False, model=model)
    # Calculate the similarity
    original_in_new, new_in_original = calculate_similarity(recipe_row['preprocessed'], resp)
    return({
        'index': recipe_row.name,
        'original_recipe': recipe_row['directions'],
        'new_recipe': resp.choices[0].message.content,
        'rules': suggestions,
        'original_in_new': original_in_new,
        'new_in_original': new_in_original
    })

def pipeline_chunk(
        chunk: pd.DataFrame,
        extracted_rules: pd.DataFrame,
        prompt_function: callable = prompt_gpt_2,
        model="gpt-3.5-turbo"
) -> List[Dict[str, any]]:
    """
        This function applies the complete_pipeline function to a chunk of recipes. Check the documentation of complete_pipeline for more details.

        Input:
            - chunk: A pandas dataframe with a column called 'preprocessed' which is a list of tokens. Note: we assume this preprocessed column is created using gensim preprocess_string.
            - extracted_rules: A pandas dataframe with columns ['antecedents', 'consequents', 'confidence', 'lift'] sorted by lift.
        
        Output:
            - A list of dictionaries, each dictionary is the output of the complete_pipeline function.
    """
    return [complete_pipeline(row, extracted_rules, prompt_function, model) for _, row in chunk.iterrows()]