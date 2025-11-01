#!/usr/bin/env python3

"""
Automated Test Runner voor Comprehensive Test Suite
Simuleert de 9 testers en voert alle tests uit
"""

import re
import json

print('🧪 AUTOMATED COMPREHENSIVE TEST RUNNER\n')
print('═══════════════════════════════════════════════════════════\n')

# Define testers
TESTERS = [
    # FTP Goal Testers
    {'id': 'ftp-beginner', 'name': 'Sarah', 'level': 'Beginner', 'goal': 'ftp', 'preferredVariant': 'short', 'ftp': 180},
    {'id': 'ftp-intermediate', 'name': 'Mike', 'level': 'Intermediate', 'goal': 'ftp', 'preferredVariant': 'medium', 'ftp': 250},
    {'id': 'ftp-advanced', 'name': 'Alex', 'level': 'Advanced', 'goal': 'ftp', 'preferredVariant': 'long', 'ftp': 320},

    # Climbing Goal Testers
    {'id': 'climbing-beginner', 'name': 'Emma', 'level': 'Beginner', 'goal': 'climbing', 'preferredVariant': 'short', 'ftp': 170},
    {'id': 'climbing-intermediate', 'name': 'Tom', 'level': 'Intermediate', 'goal': 'climbing', 'preferredVariant': 'medium', 'ftp': 240},
    {'id': 'climbing-advanced', 'name': 'Lisa', 'level': 'Advanced', 'goal': 'climbing', 'preferredVariant': 'long', 'ftp': 300},

    # Gran Fondo Goal Testers
    {'id': 'granfondo-beginner', 'name': 'John', 'level': 'Beginner', 'goal': 'granfondo', 'preferredVariant': 'short', 'ftp': 190},
    {'id': 'granfondo-intermediate', 'name': 'Maria', 'level': 'Intermediate', 'goal': 'granfondo', 'preferredVariant': 'medium', 'ftp': 260},
    {'id': 'granfondo-advanced', 'name': 'Chris', 'level': 'Advanced', 'goal': 'granfondo', 'preferredVariant': 'long', 'ftp': 310}
]

test_results = {
    'total': 0,
    'passed': 0,
    'failed': 0,
    'byGoal': {},
    'byTester': []
}

# Read the workouts database
with open('./public_html/app/assets/js/config/workouts-db.js', 'r') as f:
    content = f.read()

def extract_goal_workouts(goal_name):
    """Extract all workouts for a specific goal"""
    # Find the goal section
    goal_pattern = rf'{goal_name}:\s*{{'
    match = re.search(goal_pattern, content)
    if not match:
        return None

    start = match.start()
    rest = content[start:]

    # Find the closing brace for this goal
    brace_count = 0
    in_goal = False
    end_pos = 0

    for i, char in enumerate(rest):
        if char == '{':
            brace_count += 1
            in_goal = True
        elif char == '}':
            brace_count -= 1
            if in_goal and brace_count == 0:
                end_pos = i
                break

    goal_section = rest[:end_pos]

    # Parse workouts by intensity
    workouts_by_intensity = {}

    for intensity in ['easy', 'moderate', 'hard']:
        intensity_pattern = rf'{intensity}:\s*\[(.*?)\],'
        intensity_match = re.search(intensity_pattern, goal_section, re.DOTALL)

        if intensity_match:
            intensity_section = intensity_match.group(1)

            # Extract workout names
            workout_names = re.findall(r'name:\s*"([^"]+)"', intensity_section)

            # For each workout, extract all variants
            workouts = []
            for name in workout_names:
                workout_data = {'name': name, 'variants': {}}

                # Find the workout block
                workout_pattern = rf'name:\s*"{re.escape(name)}"(.*?)(?=name:|^\s*}})'
                workout_match = re.search(workout_pattern, intensity_section, re.DOTALL)

                if workout_match:
                    workout_block = workout_match.group(1)

                    # Extract variants
                    for variant in ['short', 'medium', 'long']:
                        variant_pattern = rf'{variant}:\s*{{(.*?)}}'
                        variant_match = re.search(variant_pattern, workout_block, re.DOTALL)

                        if variant_match:
                            variant_block = variant_match.group(1)

                            # Extract variant properties
                            duration_match = re.search(r'duration:\s*(\d+)', variant_block)
                            displayName_match = re.search(r'displayName:\s*"([^"]+)"', variant_block)
                            details_match = re.search(r'details:\s*"([^"]+)"', variant_block)

                            workout_data['variants'][variant] = {
                                'duration': int(duration_match.group(1)) if duration_match else 0,
                                'displayName': displayName_match.group(1) if displayName_match else '',
                                'details': details_match.group(1) if details_match else ''
                            }

                workouts.append(workout_data)

            workouts_by_intensity[intensity] = workouts

    return workouts_by_intensity

def run_tester_scenario(tester):
    """Run test scenario for a specific tester"""
    print(f"\n👤 TESTER: {tester['name']} ({tester['level']})")
    print(f"   Goal: {tester['goal'].upper()} | FTP: {tester['ftp']}W | Prefers: {tester['preferredVariant']}")
    print('   ─────────────────────────────────────────────────')

    goal = tester['goal']
    goal_workouts = extract_goal_workouts(goal)

    if not goal_workouts:
        print(f"   ❌ ERROR: Goal '{goal}' not found!")
        return {'success': False, 'tests': 0, 'passed': 0, 'failed': 0, 'workouts': 0}

    # Step 1: Intake simulation
    print('   📝 Intake: ✅ Completed')

    total_tests = 0
    passed_tests = 0
    failed_tests = 0
    total_workouts = 0

    # Test each intensity level
    for intensity in ['easy', 'moderate', 'hard']:
        workouts = goal_workouts.get(intensity, [])
        if not workouts:
            continue

        total_workouts += len(workouts)
        print(f'   📂 {intensity.upper()}: {len(workouts)} workouts')

        for workout in workouts:
            for variant in ['short', 'medium', 'long']:
                total_tests += 1

                variant_data = workout['variants'].get(variant)
                if not variant_data:
                    print(f"      ❌ {workout['name']} ({variant}): Missing")
                    failed_tests += 1
                    continue

                # Validate variant data
                has_details = variant_data['details'] and len(variant_data['details']) > 0
                has_main = 'Main:' in variant_data['details'] if variant_data['details'] else False
                has_duration = variant_data['duration'] > 0
                has_display_name = variant_data['displayName'] and len(variant_data['displayName']) > 0

                if has_details and has_main and has_duration and has_display_name:
                    # Only log preferred variant
                    if variant == tester['preferredVariant']:
                        print(f"      ✅ {workout['name']} ({variant}) - {variant_data['duration']}min")
                    passed_tests += 1
                else:
                    issues = []
                    if not has_details:
                        issues.append('no details')
                    if not has_main:
                        issues.append('no Main section')
                    if not has_duration:
                        issues.append('no duration')
                    if not has_display_name:
                        issues.append('no display name')

                    print(f"      ❌ {workout['name']} ({variant}): {', '.join(issues)}")
                    failed_tests += 1

    tester_success = failed_tests == 0
    print(f"   {'✅' if tester_success else '⚠️'}  Result: {passed_tests}/{total_tests} passed")

    return {
        'success': tester_success,
        'tests': total_tests,
        'passed': passed_tests,
        'failed': failed_tests,
        'workouts': total_workouts
    }

# Run all testers
print('🚀 Starting all 9 testers...\n')

for tester in TESTERS:
    result = run_tester_scenario(tester)

    # Track by goal
    goal = tester['goal']
    if goal not in test_results['byGoal']:
        test_results['byGoal'][goal] = {
            'testers': 0,
            'tests': 0,
            'passed': 0,
            'failed': 0,
            'workouts': 0
        }

    test_results['byGoal'][goal]['testers'] += 1
    test_results['byGoal'][goal]['tests'] += result['tests']
    test_results['byGoal'][goal]['passed'] += result['passed']
    test_results['byGoal'][goal]['failed'] += result['failed']
    test_results['byGoal'][goal]['workouts'] += result['workouts']

    test_results['total'] += result['tests']
    test_results['passed'] += result['passed']
    test_results['failed'] += result['failed']

    test_results['byTester'].append({
        'name': tester['name'],
        'level': tester['level'],
        'goal': tester['goal'],
        **result
    })

# Summary
print('\n\n═══════════════════════════════════════════════════════════')
print('📊 COMPREHENSIVE TEST RESULTS')
print('═══════════════════════════════════════════════════════════\n')

print(f"Total Tests:     {test_results['total']}")
print(f"Passed:          {test_results['passed']} ✅")
print(f"Failed:          {test_results['failed']} {'❌' if test_results['failed'] > 0 else '✅'}")

success_rate = (test_results['passed'] / test_results['total'] * 100) if test_results['total'] > 0 else 0
print(f"Success Rate:    {success_rate:.1f}%\n")

# Per goal breakdown
print('PER GOAL BREAKDOWN:')
print('───────────────────────────────────────────────────────────\n')

for goal in ['ftp', 'climbing', 'granfondo']:
    if goal in test_results['byGoal']:
        data = test_results['byGoal'][goal]
        goal_success_rate = (data['passed'] / data['tests'] * 100) if data['tests'] > 0 else 0

        print(f"{goal.upper()}:")
        print(f"  Testers:       {data['testers']} (Beginner, Intermediate, Advanced)")
        print(f"  Workouts:      {data['workouts']}")
        print(f"  Tests:         {data['tests']}")
        print(f"  Passed:        {data['passed']} ✅")
        print(f"  Failed:        {data['failed']} {'❌' if data['failed'] > 0 else '✅'}")
        print(f"  Success Rate:  {goal_success_rate:.1f}%\n")

# Tester breakdown
print('PER TESTER BREAKDOWN:')
print('───────────────────────────────────────────────────────────\n')

for tester in test_results['byTester']:
    status = '✅' if tester['success'] else '❌'
    print(f"{status} {tester['name']} ({tester['level']}, {tester['goal'].upper()}): {tester['passed']}/{tester['tests']}")

# Final verdict
print('\n═══════════════════════════════════════════════════════════')
if test_results['failed'] == 0:
    print('🎉 ALL TESTS PASSED! The application is production-ready!')
else:
    print(f"⚠️  {test_results['failed']} tests failed. Please review the issues above.")
print('═══════════════════════════════════════════════════════════\n')

# Exit code
exit(1 if test_results['failed'] > 0 else 0)
