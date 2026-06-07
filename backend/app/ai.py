import re
import logging

logger = logging.getLogger(__name__)

# Try to load HuggingFace pipeline, fail gracefully if not installed/available
HAS_TRANSFORMERS = False
classifier_pipeline = None
sentiment_pipeline = None

try:
    from transformers import pipeline
    # We will lazy-load the pipelines to prevent slow startup times
    HAS_TRANSFORMERS = True
except ImportError:
    logger.info("transformers package not found, using rule-based classification fallback")


def get_hf_classification(title: str, description: str) -> dict:
    global classifier_pipeline, sentiment_pipeline
    text = f"{title} {description}"
    
    try:
        if classifier_pipeline is None:
            # Using a small, lightweight model for classification
            classifier_pipeline = pipeline(
                "zero-shot-classification", 
                model="typeform/distilbert-base-uncased-mnli",
                device=-1 # CPU
            )
        if sentiment_pipeline is None:
            sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=-1 # CPU
            )

        # Classify Category
        candidate_labels = ["Electricity", "Water", "Road", "Other"]
        res = classifier_pipeline(text, candidate_labels)
        category = res["labels"][0] if res["scores"][0] > 0.4 else "Other"

        # Classify Priority (Low, Medium, High)
        priority_labels = ["low priority", "medium priority", "high priority"]
        res_priority = classifier_pipeline(text, priority_labels)
        p_label = res_priority["labels"][0]
        if "high" in p_label:
            priority = "High"
        elif "low" in p_label:
            priority = "Low"
        else:
            priority = "Medium"

        # Classify Sentiment
        res_sentiment = sentiment_pipeline(text)
        sentiment_label = res_sentiment[0]["label"].lower() # 'positive' or 'negative'
        sentiment = "negative" if "neg" in sentiment_label else "positive"

        return {
            "category": category,
            "priority": priority,
            "sentiment": sentiment
        }
    except Exception as e:
        logger.warning(f"Error in HuggingFace pipeline: {e}. Falling back to rule-based classification.")
        return get_rule_based_classification(title, description)


def get_rule_based_classification(title: str, description: str) -> dict:
    text = f"{title} {description}".lower()

    # Category Detection
    category = "Other"
    
    electricity_patterns = [
        r"electr", r"light", r"power", r"blackout", r"outage", r"fuse", r"wire", 
        r"current", r"volt", r"bulb", r"transformer", r"meter", r"spark", r"shock"
    ]
    water_patterns = [
        r"water", r"leak", r"pipe", r"drain", r"sewer", r"clog", r"supply", 
        r"drinking", r"flood", r"gutter", r"tap", r"spill", r"flow"
    ]
    road_patterns = [
        r"road", r"pothole", r"street", r"asphalt", r"highway", r"pavement", 
        r"tar", r"sidewalk", r"speed breaker", r"traffic", r"signal", r"path"
    ]

    # Calculate overlaps
    elec_score = sum(1 for p in electricity_patterns if re.search(p, text))
    water_score = sum(1 for p in water_patterns if re.search(p, text))
    road_score = sum(1 for p in road_patterns if re.search(p, text))

    max_score = max(elec_score, water_score, road_score)
    if max_score > 0:
        if max_score == elec_score:
            category = "Electricity"
        elif max_score == water_score:
            category = "Water"
        else:
            category = "Road"

    # Sentiment Analysis
    positive_words = {"good", "great", "excellent", "happy", "thank", "resolved", "fixed", "better", "clean", "solved"}
    negative_words = {
        "bad", "leak", "broken", "dirty", "delay", "worst", "fail", "error", 
        "dangerous", "hazard", "smell", "garbage", "trash", "accident", 
        "injury", "urgent", "problem", "issue", "poor", "dark", "no power",
        "not working", "damage", "complaint", "death", "kill", "harm"
    }

    words = re.findall(r"\w+", text)
    pos_count = sum(1 for w in words if w in positive_words)
    neg_count = sum(1 for w in words if w in negative_words)
    
    # Check multi-word negative phrases
    for phrase in ["not working", "no power", "power cut", "water leak", "street light"]:
        if phrase in text:
            neg_count += 2

    sentiment = "neutral"
    if neg_count > pos_count:
        sentiment = "negative"
    elif pos_count > neg_count:
        sentiment = "positive"

    # Priority Detection
    critical_indicators = [
        "danger", "hazard", "shock", "live wire", "open drain", "flood", 
        "urgent", "emergency", "fire", "immediate", "critical", "accident",
        "injury", "death", "broken wire", "current", "sparking"
    ]
    
    is_critical = any(ind in text for ind in critical_indicators)
    
    low_indicators = [
        "suggestion", "feedback", "nice", "request for information", 
        "could you", "improvement idea", "thank you"
    ]
    is_low = any(ind in text for ind in low_indicators) and neg_count <= 1

    if is_critical:
        priority = "High"
    elif is_low:
        priority = "Low"
    else:
        priority = "Medium"

    return {
        "category": category,
        "priority": priority,
        "sentiment": sentiment
    }


def analyze_grievance(title: str, description: str) -> dict:
    if HAS_TRANSFORMERS:
        return get_hf_classification(title, description)
    return get_rule_based_classification(title, description)


import math

def calculate_text_similarity(text1: str, text2: str) -> float:
    # Normalize and tokenize
    words1 = set(re.findall(r"\w+", text1.lower()))
    words2 = set(re.findall(r"\w+", text2.lower()))
    
    # Remove common English stop words to improve comparison quality
    stopwords = {
        "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "to", "of", "in", 
        "on", "at", "for", "with", "about", "against", "between", "into", "through", "during", 
        "before", "after", "above", "below", "from", "up", "down", "in", "out", "over", "under", 
        "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", 
        "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", 
        "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", 
        "should", "now", "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", 
        "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", 
        "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves"
    }
    words1 = words1 - stopwords
    words2 = words2 - stopwords
    
    if not words1 or not words2:
        return 0.0
        
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    return len(intersection) / len(union)


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Earth radius in meters
    R = 6371000.0
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    
    return R * c
