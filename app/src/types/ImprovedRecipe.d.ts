export type ImprovedRecipe = {
    recipeText: string;
    correctWords: Set<string>;
    correctSentences?: Set<string>;
};