#!/usr/bin/env python3

import re
import json

print('🧪 WORKOUT DATABASE TEST\n')
print('═══════════════════════════════════════\n')

# Read the workouts database file
with open('./public_html/app/assets/js/config/workouts-db.js', 'r') as f:
    content = f.read()

# Count goals by finding "goal: {" patterns
goals = re.findall(r'^\s+(\w+):\s*{', content, re.MULTILINE)
goals = [g for g in goals if g in ['ftp', 'climbing', 'granfondo']]

print(f'✅ Goals gevonden: {len(set(goals))}')
print(f'   → {", ".join(sorted(set(goals)))}\n')

# Check for duplicates
if len(goals) != len(set(goals)):
    print(f'⚠️  WAARSCHUWING: Duplicate goals gevonden!')
    for goal in set(goals):
        count = goals.count(goal)
        if count > 1:
            print(f'   → {goal}: {count}x gedefinieerd')
    print()
else:
    print('✅ Geen duplicate goals\n')

# Expected goals
expected_goals = ['ftp', 'climbing', 'granfondo']
missing = [g for g in expected_goals if g not in goals]
extra = [g for g in set(goals) if g not in expected_goals]

if missing:
    print(f'❌ Missende goals: {", ".join(missing)}')
if extra:
    print(f'⚠️  Extra goals: {", ".join(extra)}')
if not missing and not extra:
    print('✅ Alle verwachte goals aanwezig\n')

# Count workouts by name
workout_names = re.findall(r'name:\s*"([^"]+)"', content)
print(f'📊 Totaal workouts gevonden: {len(workout_names)}')

# Count variants
variants_short = len(re.findall(r'short:\s*{', content))
variants_medium = len(re.findall(r'medium:\s*{', content))
variants_long = len(re.findall(r'long:\s*{', content))

print(f'   → Short variants: {variants_short}')
print(f'   → Medium variants: {variants_medium}')
print(f'   → Long variants: {variants_long}')
print(f'   → Totaal variants: {variants_short + variants_medium + variants_long}\n')

# Check for "Main:" in details
details_all = re.findall(r'details:\s*"([^"]+)"', content)
details_with_main = [d for d in details_all if 'Main:' in d]

print(f'📋 Details validatie:')
print(f'   → Totaal details: {len(details_all)}')
print(f'   → Met "Main:" sectie: {len(details_with_main)}')
print(f'   → Zonder "Main:": {len(details_all) - len(details_with_main)}')

if len(details_all) == len(details_with_main):
    print(f'   ✅ Alle workouts hebben "Main:" sectie\n')
else:
    print(f'   ❌ Sommige workouts missen "Main:" sectie\n')
    # Find which ones are missing
    print('   Workouts zonder "Main:":')
    for detail in details_all:
        if 'Main:' not in detail:
            # Try to find the workout name for this detail
            idx = content.find(f'details: "{detail}"')
            if idx > 0:
                # Search backwards for the name
                before = content[:idx]
                name_match = re.findall(r'name:\s*"([^"]+)"', before)
                if name_match:
                    print(f'      • {name_match[-1][:50]}...')

# Check for proper structure (Warm-up, Main, Cool-down)
proper_structure = [d for d in details_all if 'Warm-up:' in d and 'Main:' in d and 'Cool-down:' in d]
print(f'\n📝 Structuur validatie:')
print(f'   → Met volledige structuur (Warm-up/Main/Cool-down): {len(proper_structure)}')
print(f'   → Zonder volledige structuur: {len(details_all) - len(proper_structure)}')

if len(details_all) == len(proper_structure):
    print(f'   ✅ Alle workouts hebben volledige structuur\n')
else:
    print(f'   ⚠️  Sommige workouts hebben incomplete structuur\n')

# Count each goal's workouts
print('\n═══════════════════════════════════════')
print('📊 PER GOAL BREAKDOWN')
print('═══════════════════════════════════════\n')

for goal in ['ftp', 'climbing', 'granfondo']:
    # Find the goal section
    goal_pattern = rf'{goal}:\s*{{'
    match = re.search(goal_pattern, content)
    if match:
        start = match.start()
        # Find the end (next goal or closing)
        rest = content[start:]
        # Count workouts in this section by finding "name:" before the next goal
        section = rest.split('},\n\n')[0]  # rough section extraction

        names_in_section = re.findall(r'name:\s*"([^"]+)"', section)
        print(f'{goal.upper()}:')
        print(f'   Workouts: {len(names_in_section)}')
        print(f'   Variants: {len(names_in_section) * 3} (verwacht)')

        # Count by intensity
        easy_count = section.count('easy: [')
        moderate_count = section.count('moderate: [')
        hard_count = section.count('hard: [')

        easy_workouts = []
        moderate_workouts = []
        hard_workouts = []

        # Simple parsing by sections
        if 'easy: [' in section:
            easy_section = section.split('easy: [')[1].split('],')[0]
            easy_workouts = re.findall(r'name:\s*"([^"]+)"', easy_section)
        if 'moderate: [' in section:
            moderate_section = section.split('moderate: [')[1].split('],')[0]
            moderate_workouts = re.findall(r'name:\s*"([^"]+)"', moderate_section)
        if 'hard: [' in section:
            hard_section = section.split('hard: [')[1].split(']')[0]
            hard_workouts = re.findall(r'name:\s*"([^"]+)"', hard_section)

        print(f'   • Easy: {len(easy_workouts)}')
        for name in easy_workouts:
            print(f'     - {name}')
        print(f'   • Moderate: {len(moderate_workouts)}')
        for name in moderate_workouts:
            print(f'     - {name}')
        print(f'   • Hard: {len(hard_workouts)}')
        for name in hard_workouts:
            print(f'     - {name}')
        print()

print('\n═══════════════════════════════════════')
print('✅ SAMENVATTING')
print('═══════════════════════════════════════')
print(f'Goals:          {len(set(goals))} ✅')
print(f'Workouts:       {len(workout_names)} ✅')
print(f'Variants:       {variants_short + variants_medium + variants_long} ✅')
print(f'Met "Main:":    {len(details_with_main)}/{len(details_all)} {"✅" if len(details_all) == len(details_with_main) else "❌"}')
print(f'Structuur:      {len(proper_structure)}/{len(details_all)} {"✅" if len(details_all) == len(proper_structure) else "⚠️"}')

if len(set(goals)) == 3 and len(details_all) == len(details_with_main):
    print('\n🎉 ALLE TESTS GESLAAGD!')
else:
    print('\n⚠️  Sommige issues gevonden - zie details hierboven')

print()
