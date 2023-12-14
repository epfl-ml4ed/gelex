export type BackendInput = {
    user_recipe: string,
    number_of_rules: number,
    user_id: string,
}


// Annotations is a python dictionary of the form: {'non_stemmed_word': [('stemmed_word', word_index), ('stemmed_word', word_index)], 'non_stemmed_word': [('stemmed_word', word_index), ('stemmed_word', word_index)]}
export type BackendResponse = {
    annotations: { [key: string]: Array<[string, number]> },
    ing_seperated: string,
    example_recipe: string,
}

export type BackendUserResult = {
    selectedWords: Map<number, string>,
    userId?: string,
    originalRecipe?: string,
    improvedRecipe: string,
    timestamp: string,
    improvementLevel?: number,
}