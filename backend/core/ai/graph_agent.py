import re
from core.database import get_db_client

def extract_links(text: str):
    """
    Extracts GitHub issue/PR numbers and relationship types from text.
    Patterns: 'fixes #123', 'relates to #456', 'closes #789'
    """
    results = []
    
    # Common relationship patterns
    patterns = {
        "fixes": r"(?:fixes|closes|resolves)\s+#(\d+)",
        "relates_to": r"(?:relates to|refers to|related to)\s+#(\d+)",
        "depends_on": r"(?:depends on|blocked by)\s+#(\d+)"
    }
    
    for rel_type, pattern in patterns.items():
        matches = re.findall(pattern, text, re.IGNORECASE)
        for issue_num in matches:
            results.append({
                "target_id": issue_num,
                "target_type": "issue", # In GitHub, PRs and Issues share the same numbering space
                "relationship": rel_type
            })
            
    return results

def link_entities(repo_id: str, source_id: str, source_type: str, text: str):
    """
    Parses text for links and saves them to entity_relationships.
    """
    links = extract_links(text)
    if not links:
        return
        
    client = get_db_client()
    if not client:
        return

    for link in links:
        try:
            client.table("entity_relationships").insert({
                "repo_id": repo_id,
                "source_type": source_type,
                "source_id": source_id,
                "target_type": link["target_type"],
                "target_id": link["target_id"],
                "relationship": link["relationship"]
            }).execute()
            print(f"[GRAPH] Linked {source_type} {source_id} -> {link['target_type']} {link['target_id']} ({link['relationship']})")
        except Exception as e:
            print(f"[GRAPH] Failed to link: {e}")

def get_linked_context(repo_id: str, entity_id: str, entity_type: str):
    """
    Finds all linked entities and returns their combined context.
    Traverses 1 level deep for performance.
    """
    client = get_db_client()
    if not client:
        return ""

    context = ""
    try:
        # Find links where the current entity is the SOURCE
        resp = client.table("entity_relationships") \
            .select("target_type, target_id, relationship") \
            .eq("repo_id", repo_id) \
            .eq("source_id", entity_id) \
            .eq("source_type", entity_type) \
            .execute()
            
        links = resp.data or []
        
        for link in links:
            target_type = link["target_type"]
            target_id = link["target_id"]
            rel = link["relationship"]
            
            # Fetch target details
            table = "issues" if target_type in ["issue", "pr"] else "commits"
            col = "number" if target_type in ["issue", "pr"] else "sha"
            
            target_resp = client.table(table).select("*").eq(col, target_id).execute()
            if target_resp.data:
                item = target_resp.data[0]
                context += f"\n--- Linked {target_type.upper()} ({rel} {target_id}) ---\n"
                context += f"Title: {item.get('title', item.get('message', ''))}\n"
                context += f"Body: {item.get('body', item.get('agent_analysis', ''))}\n"

    except Exception as e:
        print(f"[GRAPH] Context retrieval failed: {e}")
        
    return context
