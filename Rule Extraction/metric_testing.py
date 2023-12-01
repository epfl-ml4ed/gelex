from typing import List
import pandas as pd
# multiprocessing
from multiprocessing import Pool
from functools import partial
# CPU count
import os
import numpy as np
from concurrent.futures import ProcessPoolExecutor, as_completed

def process_task(metric, recipes_chunk, sorted_rules_df, rule_count, rule_extractor):
    results = []
    for index, recipe in recipes_chunk.iterrows():
        # print(f"Processing recipe: {recipe['id']}, {recipe.preprocessed}")
        rule_set, rule_dict = rule_extractor(recipe=recipe["preprocessed"], rules=sorted_rules_df, rule_count=rule_count, metric=metric)
        # print(f"Recipe: {recipe['id']} - Rule Set: {rule_set} - Rule Dict: {rule_dict}")
        results.append((recipe['id'], metric, (rule_set, rule_dict)))
    return results

def create_tasks(df, metrics, num_cpus, rules_df, rule_count, rule_extractor):
    chunk_size = len(df) // (num_cpus // len(metrics))  # Number of CPUs divided by the number of metrics
    chunks = [df.iloc[i:i + chunk_size] for i in range(0, len(df), chunk_size)]

    tasks = []
    for metric in metrics:
        sorted_rules_df = rules_df.sort_values(metric, ascending=False)
        for chunk in chunks:
            tasks.append((metric, chunk, sorted_rules_df, rule_count, rule_extractor))

    return tasks

def parallel_process(tasks, cpu_count=10):
    with Pool(cpu_count) as pool:
        results = pool.starmap(process_task, tasks)
    return results

def metric_test(metric_list: List[str], 
                rules: pd.DataFrame, 
                recipes:pd.DataFrame, 
                rule_extractor):
    # Now divide the CPU count by the length of the metric list
    # This way each metric will be tested on the same number of CPUs
    cpu_per_metric = os.cpu_count() // len(metric_list)
    metric_results = {}
    for metric in metric_list:
        print(f"Testing metric: {metric}")
        # Divide the recipes into chunks where len chunk = cpu_per_metric
        recipe_chunks = np.array_split(recipes, cpu_per_metric)
        print(f"Number of chunks: {len(recipe_chunks)}")
        # Map Async each chunk to a CPU, we want it to be non-blocking so we can continue to the next metric
        # and gather the results later
        with Pool(cpu_per_metric) as p:
            fn = partial(extract_rule_from_chunk, metric, rules.sort_values(metric, ascending=False).copy(), rule_extractor)
            results = p.map_async(fn, recipe_chunks)
            metric_results[metric] = results
    return metric_results


def extract_rule_from_chunk(metric: str, rules: pd.DataFrame, recipe_chunk: pd.DataFrame, rule_extractor):
    # Apply the rule extractor to each recipe in the chunk
    to_return = []
    for index, recipe in recipe_chunk.iterrows():
        result = rule_extractor(recipe=recipe['preprocessed'], rules=rules, metric=metric, rule_count=10)
        to_return.append(
            (recipe['id'], metric, result)
        )
    return to_return