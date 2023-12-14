export type ImprovedRecipe = {
    recipeText: string;
    annotations: {[key: string]: Array<[string, number]>};
    correctSentences?: Set<string>;
};