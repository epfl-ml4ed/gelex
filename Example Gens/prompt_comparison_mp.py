import sys
sys.path.append('../')
import helpers_for_backend as hfb
from multiprocessing import Pool
import time
import random
from urllib.error import HTTPError

def create_tasks(prompt_functions, rule_counts, relex_examples, extracted_rules):
    tasks = []
    for i, prompt_function in enumerate(prompt_functions):
        tasks.append((i, prompt_function, rule_counts, relex_examples, extracted_rules))
    return tasks

def process_prompt_fn(task_index, prompt_function, rule_counts, relex_examples, extracted_rules):
    prompt_function_results = {}
    prompt_function_results[prompt_function.__name__] = {}
    total_count = len(rule_counts) * len(relex_examples)
    current_progress = 0
    print(f"Starting task {task_index}")
    for rule_count in rule_counts:
        prompt_function_results[prompt_function.__name__][rule_count] = []
        i = 0
        retry_count = 0
        while i < len(relex_examples):
            try:
                row = relex_examples.iloc[i]
                fulfilled_rules, suggestions = hfb.extract_rules(
                    recipe=row['preprocessed'],
                    rules=extracted_rules,
                    rule_count=rule_count,
                    metric='lift',
                )
                prompt = hfb.create_prompt(
                    directions=row['recipe'],
                    fulfilled_rules=fulfilled_rules,
                    suggestions=suggestions,
                )
                response = prompt_function(
                    prompt=prompt,
                    print_response=False,
                    model='gpt-4'
                )
                fullfilled_percentage = hfb.get_fullfilled_percentage(response, suggestions)
                prompt_function_results[prompt_function.__name__][rule_count].append((i,response.choices[0].message.content,fullfilled_percentage))
            # Catch HTTP and Connection errors
            except HTTPError as e:
                # Sleep a little, then retry
                print(f"Task {task_index} failed on row {i} due to HTTPError, rule count {rule_count}")
                time.sleep(random.randint(1, 8))
                continue
            except ConnectionError as e:
                # Sleep a little, then retry
                print(f"Task {task_index} failed on row {i} due to ConnectionError, rule count {rule_count}")
                time.sleep(random.randint(1, 8))
                continue
            except Exception as e:
                retry_count += 1
                if retry_count < 3:
                    print(f"Task {task_index} row: {i}, rule count {rule_count} Retry count: {retry_count} failed due to {e}")
                    print(f"Retrying...")
                    continue
                else:
                    print(f"Task {task_index} row: {i}, rule count {rule_count}, failed due to {e}. Skipping...")
                    prompt_function_results[prompt_function.__name__][rule_count].append((i,None,None))
            current_progress += 1
            # print progress at every 10%
            progress_percentage = current_progress / total_count
            if progress_percentage % 0.1 == 0:
                print(f"Task {task_index} progress: {progress_percentage}")
            i += 1
            retry_count = 0
    return prompt_function_results


def parallel_process(tasks, cpu_count=10):
    if(len(tasks) < cpu_count):
        cpu_count = len(tasks)
    with Pool(cpu_count) as pool:
        results = pool.starmap(process_prompt_fn, tasks)
    return results