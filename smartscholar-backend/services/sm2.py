from datetime import datetime, timedelta

def calculate_next_review(quality: int, interval: int, repetitions: int, easiness: float):
    """
    SM-2 Algorithm Implementation
    quality: 0-5 (0=forgot, 5=perfect)
    interval: current interval in days
    repetitions: number of successful repetitions
    easiness: easiness factor
    
    Returns: (next_interval, next_repetitions, next_easiness)
    """
    if quality >= 3:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = round(interval * easiness)
        repetitions += 1
    else:
        repetitions = 0
        interval = 1
        
    easiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if easiness < 1.3:
        easiness = 1.3
        
    return interval, repetitions, easiness
