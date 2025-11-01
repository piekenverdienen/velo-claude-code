#!/usr/bin/env node

// Test script voor workout database validatie
const fs = require('fs');
const path = require('path');

console.log('🧪 WORKOUT DATABASE TEST\n');
console.log('═══════════════════════════════════════\n');

// Load workouts database
const dbPath = './public_html/app/assets/js/config/workouts-db.js';
const dbContent = fs.readFileSync(dbPath, 'utf8');

// Extract WORKOUTS_DB object (simple eval for testing)
const WORKOUTS_DB = eval(dbContent.match(/const WORKOUTS_DB = ({[\s\S]*});/)[1]);

const goals = Object.keys(WORKOUTS_DB);
console.log(`✅ Goals gevonden: ${goals.length}`);
console.log(`   → ${goals.join(', ')}\n`);

// Expected goals
const expectedGoals = ['ftp', 'climbing', 'granfondo'];
const missingGoals = expectedGoals.filter(g => !goals.includes(g));
const extraGoals = goals.filter(g => !expectedGoals.includes(g));

if (missingGoals.length > 0) {
    console.log(`❌ Missende goals: ${missingGoals.join(', ')}`);
}
if (extraGoals.length > 0) {
    console.log(`⚠️  Extra goals: ${extraGoals.join(', ')}`);
}
if (missingGoals.length === 0 && extraGoals.length === 0) {
    console.log('✅ Alle verwachte goals aanwezig\n');
}

// Test each goal
let totalWorkouts = 0;
let totalVariants = 0;
let errors = [];

goals.forEach(goal => {
    console.log(`\n📊 GOAL: ${goal.toUpperCase()}`);
    console.log('─────────────────────────────────────');

    const intensities = ['easy', 'moderate', 'hard'];
    let goalWorkoutCount = 0;
    let goalVariantCount = 0;

    intensities.forEach(intensity => {
        const workouts = WORKOUTS_DB[goal][intensity] || [];
        console.log(`\n  ${intensity.toUpperCase()}: ${workouts.length} workouts`);

        workouts.forEach((workout, idx) => {
            goalWorkoutCount++;
            totalWorkouts++;

            console.log(`    ${idx + 1}. ${workout.name}`);
            console.log(`       Intensity: ${workout.intensity}`);

            // Check variants
            const variants = ['short', 'medium', 'long'];
            const variantKeys = Object.keys(workout.variants || {});
            const missingVariants = variants.filter(v => !variantKeys.includes(v));

            if (missingVariants.length > 0) {
                errors.push(`${goal}/${intensity}/${workout.name}: Missing variants: ${missingVariants.join(', ')}`);
                console.log(`       ❌ Missing variants: ${missingVariants.join(', ')}`);
            } else {
                console.log(`       ✅ All 3 variants present`);
            }

            // Check each variant
            variants.forEach(variant => {
                if (workout.variants[variant]) {
                    goalVariantCount++;
                    totalVariants++;

                    const v = workout.variants[variant];
                    const hasDetails = v.details && v.details.length > 0;
                    const hasMain = v.details && v.details.includes('Main:');
                    const hasDuration = v.duration && v.duration > 0;

                    if (!hasDetails) {
                        errors.push(`${goal}/${intensity}/${workout.name}/${variant}: No details`);
                    }
                    if (!hasMain) {
                        errors.push(`${goal}/${intensity}/${workout.name}/${variant}: No "Main:" section`);
                    }
                    if (!hasDuration) {
                        errors.push(`${goal}/${intensity}/${workout.name}/${variant}: No duration`);
                    }

                    const status = hasDetails && hasMain && hasDuration ? '✅' : '❌';
                    console.log(`          ${variant}: ${v.duration}min ${status}`);
                }
            });
        });
    });

    console.log(`\n  Totaal: ${goalWorkoutCount} workouts, ${goalVariantCount} variants`);
});

console.log('\n\n═══════════════════════════════════════');
console.log('📊 TOTAAL OVERZICHT');
console.log('═══════════════════════════════════════');
console.log(`Goals:    ${goals.length}`);
console.log(`Workouts: ${totalWorkouts}`);
console.log(`Variants: ${totalVariants}`);

if (errors.length > 0) {
    console.log('\n\n❌ ERRORS GEVONDEN:');
    console.log('═══════════════════════════════════════');
    errors.forEach(err => console.log(`  • ${err}`));
} else {
    console.log('\n\n✅ ALLE TESTS GESLAAGD!');
    console.log('═══════════════════════════════════════');
    console.log('• Alle goals aanwezig');
    console.log('• Alle workouts hebben 3 variants');
    console.log('• Alle variants hebben details');
    console.log('• Alle details hebben "Main:" sectie');
    console.log('• Alle variants hebben duration');
}

console.log('\n');
