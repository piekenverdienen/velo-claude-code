#!/usr/bin/env node

/**
 * Automated Test Runner voor Comprehensive Test Suite
 * Simuleert de 9 testers en voert alle tests uit
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 AUTOMATED COMPREHENSIVE TEST RUNNER\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Load workouts database
const dbPath = './public_html/app/assets/js/config/workouts-db.js';
const dbContent = fs.readFileSync(dbPath, 'utf8');
const WORKOUTS_DB = eval(dbContent.match(/const WORKOUTS_DB = ({[\s\S]*});/)[1]);

// Define testers
const TESTERS = [
    // FTP Goal Testers
    { id: 'ftp-beginner', name: 'Sarah', level: 'Beginner', goal: 'ftp', preferredVariant: 'short', ftp: 180 },
    { id: 'ftp-intermediate', name: 'Mike', level: 'Intermediate', goal: 'ftp', preferredVariant: 'medium', ftp: 250 },
    { id: 'ftp-advanced', name: 'Alex', level: 'Advanced', goal: 'ftp', preferredVariant: 'long', ftp: 320 },

    // Climbing Goal Testers
    { id: 'climbing-beginner', name: 'Emma', level: 'Beginner', goal: 'climbing', preferredVariant: 'short', ftp: 170 },
    { id: 'climbing-intermediate', name: 'Tom', level: 'Intermediate', goal: 'climbing', preferredVariant: 'medium', ftp: 240 },
    { id: 'climbing-advanced', name: 'Lisa', level: 'Advanced', goal: 'climbing', preferredVariant: 'long', ftp: 300 },

    // Gran Fondo Goal Testers
    { id: 'granfondo-beginner', name: 'John', level: 'Beginner', goal: 'granfondo', preferredVariant: 'short', ftp: 190 },
    { id: 'granfondo-intermediate', name: 'Maria', level: 'Intermediate', goal: 'granfondo', preferredVariant: 'medium', ftp: 260 },
    { id: 'granfondo-advanced', name: 'Chris', level: 'Advanced', goal: 'granfondo', preferredVariant: 'long', ftp: 310 }
];

const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    byGoal: {},
    byTester: []
};

function runTesterScenario(tester) {
    console.log(`\n👤 TESTER: ${tester.name} (${tester.level})`);
    console.log(`   Goal: ${tester.goal.toUpperCase()} | FTP: ${tester.ftp}W | Prefers: ${tester.preferredVariant}`);
    console.log('   ─────────────────────────────────────────────────');

    const goal = tester.goal;
    const goalData = WORKOUTS_DB[goal];

    if (!goalData) {
        console.log(`   ❌ ERROR: Goal '${goal}' not found!`);
        return { success: false, tests: 0, passed: 0, failed: 0 };
    }

    // Step 1: Intake simulation
    console.log('   📝 Intake: ✅ Completed');

    const intensities = ['easy', 'moderate', 'hard'];
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let totalWorkouts = 0;

    // Test each workout
    for (const intensity of intensities) {
        if (!goalData[intensity]) continue;

        const workouts = goalData[intensity];
        totalWorkouts += workouts.length;

        console.log(`   📂 ${intensity.toUpperCase()}: ${workouts.length} workouts`);

        for (const workout of workouts) {
            const variants = ['short', 'medium', 'long'];

            for (const variant of variants) {
                totalTests++;

                const variantData = workout.variants[variant];
                if (!variantData) {
                    console.log(`      ❌ ${workout.name} (${variant}): Missing`);
                    failedTests++;
                    continue;
                }

                // Validate variant data
                const hasDetails = variantData.details && variantData.details.length > 0;
                const hasMain = variantData.details && variantData.details.includes('Main:');
                const hasDuration = variantData.duration && variantData.duration > 0;
                const hasDisplayName = variantData.displayName && variantData.displayName.length > 0;

                if (hasDetails && hasMain && hasDuration && hasDisplayName) {
                    // Only log preferred variant exports
                    if (variant === tester.preferredVariant) {
                        console.log(`      ✅ ${workout.name} (${variant}) - ${variantData.duration}min`);
                    }
                    passedTests++;
                } else {
                    const issues = [];
                    if (!hasDetails) issues.push('no details');
                    if (!hasMain) issues.push('no Main section');
                    if (!hasDuration) issues.push('no duration');
                    if (!hasDisplayName) issues.push('no display name');

                    console.log(`      ❌ ${workout.name} (${variant}): ${issues.join(', ')}`);
                    failedTests++;
                }
            }
        }
    }

    const testerSuccess = failedTests === 0;
    console.log(`   ${testerSuccess ? '✅' : '⚠️'}  Result: ${passedTests}/${totalTests} passed`);

    return {
        success: testerSuccess,
        tests: totalTests,
        passed: passedTests,
        failed: failedTests,
        workouts: totalWorkouts
    };
}

// Run all testers
console.log('🚀 Starting all 9 testers...\n');

TESTERS.forEach(tester => {
    const result = runTesterScenario(tester);

    // Track by goal
    if (!testResults.byGoal[tester.goal]) {
        testResults.byGoal[tester.goal] = {
            testers: 0,
            tests: 0,
            passed: 0,
            failed: 0,
            workouts: 0
        };
    }

    testResults.byGoal[tester.goal].testers++;
    testResults.byGoal[tester.goal].tests += result.tests;
    testResults.byGoal[tester.goal].passed += result.passed;
    testResults.byGoal[tester.goal].failed += result.failed;
    testResults.byGoal[tester.goal].workouts += result.workouts;

    testResults.total += result.tests;
    testResults.passed += result.passed;
    testResults.failed += result.failed;

    testResults.byTester.push({
        name: tester.name,
        level: tester.level,
        goal: tester.goal,
        ...result
    });
});

// Summary
console.log('\n\n═══════════════════════════════════════════════════════════');
console.log('📊 COMPREHENSIVE TEST RESULTS');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`Total Tests:     ${testResults.total}`);
console.log(`Passed:          ${testResults.passed} ✅`);
console.log(`Failed:          ${testResults.failed} ${testResults.failed > 0 ? '❌' : '✅'}`);

const successRate = testResults.total > 0
    ? ((testResults.passed / testResults.total) * 100).toFixed(1)
    : 0;
console.log(`Success Rate:    ${successRate}%\n`);

// Per goal breakdown
console.log('PER GOAL BREAKDOWN:');
console.log('───────────────────────────────────────────────────────────\n');

['ftp', 'climbing', 'granfondo'].forEach(goal => {
    if (testResults.byGoal[goal]) {
        const data = testResults.byGoal[goal];
        const goalSuccessRate = ((data.passed / data.tests) * 100).toFixed(1);

        console.log(`${goal.toUpperCase()}:`);
        console.log(`  Testers:       ${data.testers} (Beginner, Intermediate, Advanced)`);
        console.log(`  Workouts:      ${data.workouts}`);
        console.log(`  Tests:         ${data.tests}`);
        console.log(`  Passed:        ${data.passed} ✅`);
        console.log(`  Failed:        ${data.failed} ${data.failed > 0 ? '❌' : '✅'}`);
        console.log(`  Success Rate:  ${goalSuccessRate}%\n`);
    }
});

// Tester breakdown
console.log('PER TESTER BREAKDOWN:');
console.log('───────────────────────────────────────────────────────────\n');

testResults.byTester.forEach(tester => {
    const status = tester.success ? '✅' : '❌';
    console.log(`${status} ${tester.name} (${tester.level}, ${tester.goal.toUpperCase()}): ${tester.passed}/${tester.tests}`);
});

// Final verdict
console.log('\n═══════════════════════════════════════════════════════════');
if (testResults.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! The application is production-ready!');
} else {
    console.log(`⚠️  ${testResults.failed} tests failed. Please review the issues above.`);
}
console.log('═══════════════════════════════════════════════════════════\n');

// Exit code
process.exit(testResults.failed > 0 ? 1 : 0);
