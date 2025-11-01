// Workout Database - Alle workouts georganiseerd per doel en intensiteit
// Variant System: Elk workout heeft 3 varianten (short/medium/long) voor flexibiliteit
const WORKOUTS_DB = {
    ftp: {
        easy: [
            {
                name: "Zone 1 Base Builder",
                description: "Easy spin. This is your 80%. Keep it conversational.",
                intensity: "65% FTP",
                tips: "If you're breathing hard, you're going too hard. This builds your aerobic engine.",
                variants: {
                    short: {
                        duration: 45,
                        displayName: "Zone 1 Base Builder (Quick)",
                        details: "Warm-up: 5 min easy spin. Main: 35 min steady Zone 1. Cool-down: 5 min spin."
                    },
                    medium: {
                        duration: 75,
                        displayName: "Zone 1 Base Builder",
                        details: "Warm-up: 10 min easy spin. Main: 60 min steady Zone 1. Cool-down: 5 min spin."
                    },
                    long: {
                        duration: 105,
                        displayName: "Zone 1 Base Builder (Extended)",
                        details: "Warm-up: 15 min easy spin. Main: 80 min steady Zone 1. Cool-down: 10 min spin."
                    }
                }
            },
            {
                name: "Active Recovery",
                description: "Super easy. High cadence, minimal resistance.",
                intensity: "55% FTP",
                tips: "Your legs might feel heavy at first. That's normal. They'll loosen up.",
                variants: {
                    short: {
                        duration: 30,
                        displayName: "Active Recovery (Quick)",
                        details: "Warm-up: 5 min easy. Main: 20 min @ 55% FTP, high cadence 90+ rpm. Cool-down: 5 min."
                    },
                    medium: {
                        duration: 50,
                        displayName: "Active Recovery",
                        details: "Warm-up: 5 min easy. Main: 40 min @ 55% FTP, high cadence 90+ rpm. Cool-down: 5 min."
                    },
                    long: {
                        duration: 75,
                        displayName: "Active Recovery (Extended)",
                        details: "Warm-up: 10 min easy. Main: 60 min @ 55% FTP, high cadence 90+ rpm. Cool-down: 5 min."
                    }
                }
            },
            {
                name: "Aerobic Foundation",
                description: "Steady Zone 1. Building that massive aerobic base.",
                intensity: "70-75% FTP",
                tips: "This is where the magic happens. Trust the process.",
                variants: {
                    short: {
                        duration: 60,
                        displayName: "Aerobic Foundation (Quick)",
                        details: "Warm-up: 10 min. Main: 45 min constant Zone 1. Cool-down: 5 min."
                    },
                    medium: {
                        duration: 90,
                        displayName: "Aerobic Foundation",
                        details: "Warm-up: 15 min. Main: 70 min constant Zone 1. Cool-down: 5 min."
                    },
                    long: {
                        duration: 120,
                        displayName: "Aerobic Foundation (Extended)",
                        details: "Warm-up: 15 min. Main: 95 min constant Zone 1. Last 10 min can be slightly harder. Cool-down: 10 min."
                    }
                }
            }
        ],
        moderate: [
            {
                name: "Tempo Intervals",
                description: "Threshold intervals with recovery.",
                intensity: "80-85% FTP",
                tips: "This is 'comfortably hard'. You're building lactate tolerance.",
                variants: {
                    short: {
                        duration: 50,
                        displayName: "Tempo Intervals (Quick)",
                        details: "Warm-up: 10 min. Main: 2x8 min @ 80-85% FTP, 4 min easy. Cool-down: 10 min."
                    },
                    medium: {
                        duration: 70,
                        displayName: "Tempo Intervals",
                        details: "Warm-up: 15 min. Main: 3x8 min @ 80-85% FTP, 4 min easy. Cool-down: 10 min."
                    },
                    long: {
                        duration: 90,
                        displayName: "Tempo Intervals (Extended)",
                        details: "Warm-up: 15 min. Main: 4x8 min @ 80-85% FTP, 4 min easy. Cool-down: 15 min."
                    }
                }
            },
            {
                name: "Sweet Spot Pyramid",
                description: "Progressive pyramid just below FTP.",
                intensity: "88-92% FTP",
                tips: "The perfect balance of volume and intensity. This is gold.",
                variants: {
                    short: {
                        duration: 55,
                        displayName: "Sweet Spot Pyramid (Quick)",
                        details: "Warm-up: 10 min. Main: 5-8-5 min @ 88-92% FTP, 3 min easy. Cool-down: 10 min."
                    },
                    medium: {
                        duration: 75,
                        displayName: "Sweet Spot Pyramid",
                        details: "Warm-up: 15 min. Main: 5-10-15-10-5 min @ 88-92% FTP, 3 min easy. Cool-down: 10 min."
                    },
                    long: {
                        duration: 95,
                        displayName: "Sweet Spot Pyramid (Extended)",
                        details: "Warm-up: 15 min. Main: 8-12-15-12-8 min @ 88-92% FTP, 3 min easy. Cool-down: 10 min."
                    }
                }
            },
            {
                name: "Threshold Progression",
                description: "Building blocks at sustainable power.",
                intensity: "85-90% FTP",
                tips: "Each interval slightly harder. Learn to pace yourself.",
                variants: {
                    short: {
                        duration: 50,
                        displayName: "Threshold Progression (Quick)",
                        details: "Warm-up: 10 min. Main: 3x6 min @ 85-90% FTP (progressive), 3 min recovery. Cool-down: 8 min."
                    },
                    medium: {
                        duration: 65,
                        displayName: "Threshold Progression",
                        details: "Warm-up: 15 min. Main: 4x6 min @ 85-90% FTP (progressive), 3 min recovery. Cool-down: 10 min."
                    },
                    long: {
                        duration: 85,
                        displayName: "Threshold Progression (Extended)",
                        details: "Warm-up: 15 min. Main: 5x7 min @ 85-90% FTP (progressive), 3 min recovery. Cool-down: 10 min."
                    }
                }
            }
        ],
        hard: [
            {
                name: "Zone 3 Crusher",
                description: "FTP intervals. This is your 20%.",
                intensity: "95-100% FTP",
                tips: "This should hurt. If it doesn't, you're not at FTP.",
                variants: {
                    short: {
                        duration: 50,
                        displayName: "Zone 3 Crusher (Quick)",
                        details: "Warm-up: 12 min with 2x1 min builds. Main: 2x8 min @ FTP, 5 min recovery. Cool-down: 8 min."
                    },
                    medium: {
                        duration: 65,
                        displayName: "Zone 3 Crusher",
                        details: "Warm-up: 15 min with 3x1 min builds. Main: 2x10 min @ FTP, 5 min recovery. Cool-down: 10 min."
                    },
                    long: {
                        duration: 80,
                        displayName: "Zone 3 Crusher (Extended)",
                        details: "Warm-up: 15 min with 3x1 min builds. Main: 2x15 min @ FTP, 7 min recovery. Cool-down: 10 min."
                    }
                }
            },
            {
                name: "VO2 Max Destroyer",
                description: "All-out efforts. Maximum gains.",
                intensity: "110-120% FTP",
                tips: "The last minute should be torture. That's when you're making gains.",
                variants: {
                    short: {
                        duration: 45,
                        displayName: "VO2 Max Destroyer (Quick)",
                        details: "Warm-up: 12 min. Main: 4x3 min @ 110-120% FTP, 3 min recovery. Cool-down: 8 min."
                    },
                    medium: {
                        duration: 60,
                        displayName: "VO2 Max Destroyer",
                        details: "Warm-up: 15 min. Main: 5x3 min @ 110-120% FTP, 3 min recovery. Cool-down: 10 min."
                    },
                    long: {
                        duration: 75,
                        displayName: "VO2 Max Destroyer (Extended)",
                        details: "Warm-up: 15 min. Main: 6x4 min @ 110-120% FTP, 3 min recovery. Cool-down: 10 min."
                    }
                }
            },
            {
                name: "Polarized Power Test",
                description: "Test workout to gauge your progress.",
                intensity: "Variable",
                tips: "Use this to test your FTP. If it feels easy, time to increase your zones.",
                variants: {
                    short: {
                        duration: 55,
                        displayName: "Polarized Power Test (Quick)",
                        details: "Warm-up: 15 min progressive builds. Main: 2x10 min @ 100% FTP, 10 min recovery. Cool-down: 10 min."
                    },
                    medium: {
                        duration: 70,
                        displayName: "Polarized Power Test",
                        details: "Warm-up: 20 min progressive builds. Main: 2x12 min @ 100% FTP, 16 min recovery. Cool-down: 10 min."
                    },
                    long: {
                        duration: 85,
                        displayName: "Polarized Power Test (Extended)",
                        details: "Warm-up: 20 min progressive builds. Main: 2x15 min @ 100% FTP, 20 min recovery. Cool-down: 15 min."
                    }
                }
            },
            {
                name: "Sprint Power Repeats",
                description: "Short, explosive efforts for raw power.",
                intensity: "150%+ FTP",
                tips: "These are MAX efforts. If you can talk, you're not going hard enough.",
                variants: {
                    short: {
                        duration: 40,
                        displayName: "Sprint Power Repeats (Quick)",
                        details: "Warm-up: 12 min. Main: 6x30 seconds all-out, 3 min recovery. Cool-down: 8 min."
                    },
                    medium: {
                        duration: 55,
                        displayName: "Sprint Power Repeats",
                        details: "Warm-up: 15 min. Main: 8x30 seconds all-out, 3 min recovery. Cool-down: 10 min."
                    },
                    long: {
                        duration: 70,
                        displayName: "Sprint Power Repeats (Extended)",
                        details: "Warm-up: 15 min. Main: 10x30 seconds all-out, 3 min recovery. Cool-down: 10 min."
                    }
                }
            }
        ]
    },
    
    climbing: {
        easy: [
            {
                name: "Zone 1 Climb Sim",
                description: "Easy climbing simulation. Higher resistance, lower cadence.",
                intensity: "65-70% FTP",
                tips: "Practice your climbing position. Hands on tops, straight back.",
                variants: {
                    short: {
                        duration: 45,
                        displayName: "Zone 1 Climb Sim (Quick)",
                        details: "Warm-up: 10 min easy. Main: 30 min @ 65-70% FTP, 70-75 rpm, seated. Cool-down: 5 min."
                    },
                    medium: {
                        duration: 75,
                        displayName: "Zone 1 Climb Sim",
                        details: "Warm-up: 10 min easy. Main: 60 min @ 65-70% FTP, 70-75 rpm, seated. Cool-down: 5 min."
                    },
                    long: {
                        duration: 105,
                        displayName: "Zone 1 Climb Sim (Extended)",
                        details: "Warm-up: 15 min easy. Main: 85 min @ 65-70% FTP, 70-75 rpm, seated. Cool-down: 5 min."
                    }
                }
            },
            {
                name: "Cadence Climb Drills",
                description: "Variable cadence climbing prep.",
                intensity: "60-70% FTP",
                tips: "Learn to use different cadences. Mountains demand versatility.",
                variants: {
                    short: {
                        duration: 40,
                        displayName: "Cadence Climb Drills (Quick)",
                        details: "Warm-up: 5 min. Main: 30 min alternating 4 min @ 60 rpm, 4 min @ 90 rpm @ 65% FTP. Cool-down: 5 min."
                    },
                    medium: {
                        duration: 65,
                        displayName: "Cadence Climb Drills",
                        details: "Warm-up: 10 min. Main: 50 min alternating 5 min @ 60 rpm, 5 min @ 90 rpm @ 65% FTP. Cool-down: 5 min."
                    },
                    long: {
                        duration: 90,
                        displayName: "Cadence Climb Drills (Extended)",
                        details: "Warm-up: 10 min. Main: 75 min alternating 6 min @ 60 rpm, 6 min @ 90 rpm @ 65% FTP. Cool-down: 5 min."
                    }
                }
            },
            {
                name: "Seated Climbing Endurance",
                description: "Long, steady seated climbing practice.",
                intensity: "68-72% FTP",
                tips: "This builds climbing-specific endurance. Stay seated the entire time.",
                variants: {
                    short: {
                        duration: 55,
                        displayName: "Seated Climbing Endurance (Quick)",
                        details: "Warm-up: 10 min. Main: 40 min @ 68-72% FTP, 65-70 rpm, seated. Cool-down: 5 min."
                    },
                    medium: {
                        duration: 85,
                        displayName: "Seated Climbing Endurance",
                        details: "Warm-up: 10 min. Main: 70 min @ 68-72% FTP, 65-70 rpm, seated. Cool-down: 5 min."
                    },
                    long: {
                        duration: 115,
                        displayName: "Seated Climbing Endurance (Extended)",
                        details: "Warm-up: 15 min. Main: 95 min @ 68-72% FTP, 65-70 rpm, seated. Cool-down: 5 min."
                    }
                }
            }
        ],
        moderate: [
            {
                name: "Threshold Climbs",
                description: "Steady climbs at threshold.",
                intensity: "75-80% FTP",
                tips: "Find your rhythm. Practice seated/standing transitions.",
                variants: {
                    short: {
                        duration: 50,
                        displayName: "Threshold Climbs (Quick)",
                        details: "Warm-up: 10 min. Main: 2x10 min climb simulation @ 75-80% FTP, 5 min recovery. Cool-down: 10 min."
                    },
                    medium: {
                        duration: 70,
                        displayName: "Threshold Climbs",
                        details: "Warm-up: 15 min. Main: 3x10 min climb simulation @ 75-80% FTP, 5 min recovery. Cool-down: 10 min."
                    },
                    long: {
                        duration: 90,
                        displayName: "Threshold Climbs (Extended)",
                        details: "Warm-up: 15 min. Main: 4x10 min climb simulation @ 75-80% FTP, 5 min recovery. Cool-down: 15 min."
                    }
                }
            },
            {
                name: "Climb Repeats",
                description: "Short, punchy climb intervals.",
                intensity: "80-90% FTP",
                tips: "Master the out-of-saddle technique. Weight forward, core engaged.",
                variants: {
                    short: {
                        duration: 55,
                        displayName: "Climb Repeats (Quick)",
                        details: "Warm-up: 10 min. Main: 4x5 min alternating 80% (seated) and 90% FTP (standing). 3 min recovery. Cool-down: 10 min."
                    },
                    medium: {
                        duration: 75,
                        displayName: "Climb Repeats",
                        details: "Warm-up: 15 min. Main: 6x5 min alternating 80% (seated) and 90% FTP (standing). 3 min recovery. Cool-down: 10 min."
                    },
                    long: {
                        duration: 95,
                        displayName: "Climb Repeats (Extended)",
                        details: "Warm-up: 15 min. Main: 8x5 min alternating 80% (seated) and 90% FTP (standing). 3 min recovery. Cool-down: 15 min."
                    }
                }
            },
            {
                name: "Variable Grade Simulation",
                description: "Simulate changing gradients on a long climb.",
                intensity: "70-85% FTP",
                tips: "This mimics real climbs with varying gradients. Learn to adjust effort.",
                variants: {
                    short: {
                        duration: 50,
                        displayName: "Variable Grade Simulation (Quick)",
                        details: "Warm-up: 10 min. Main: 30 min alternating 3 min @ 70%, 2 min @ 85% FTP. Cool-down: 10 min."
                    },
                    medium: {
                        duration: 70,
                        displayName: "Variable Grade Simulation",
                        details: "Warm-up: 15 min. Main: 40 min alternating 3 min @ 70%, 2 min @ 85% FTP. Cool-down: 15 min."
                    },
                    long: {
                        duration: 90,
                        displayName: "Variable Grade Simulation (Extended)",
                        details: "Warm-up: 15 min. Main: 60 min alternating 3 min @ 70%, 2 min @ 85% FTP. Cool-down: 15 min."
                    }
                }
            }
        ],
        hard: [
            {
                name: "Mountain Intervals",
                description: "Long intervals at climbing power. Brutal.",
                intensity: "85-90% FTP",
                tips: "Start conservative. The second half is where champions are made.",
                variants: {
                    short: {
                        duration: 50,
                        displayName: "Mountain Intervals (Quick)",
                        details: "Warm-up: 12 min. Main: 2x12 min @ 85-90% FTP, 8 min recovery. Cool-down: 10 min."
                    },
                    medium: {
                        duration: 65,
                        displayName: "Mountain Intervals",
                        details: "Warm-up: 15 min. Main: 2x20 min @ 85-90% FTP, 10 min recovery. Cool-down: 10 min."
                    },
                    long: {
                        duration: 85,
                        displayName: "Mountain Intervals (Extended)",
                        details: "Warm-up: 15 min. Main: 2x25 min @ 85-90% FTP, 10 min recovery. Cool-down: 15 min."
                    }
                }
            },
            {
                name: "HC Climb Simulation",
                description: "Simulate a beyond category climb.",
                intensity: "75-95% FTP",
                tips: "This simulates an Alpine giant. Learn to suffer with style.",
                variants: {
                    short: {
                        duration: 60,
                        displayName: "HC Climb Simulation (Quick)",
                        details: "Warm-up: 15 min. Main: 35 min climbing @ 75% FTP with 4x2 min surges @ 95% FTP. Cool-down: 10 min."
                    },
                    medium: {
                        duration: 80,
                        displayName: "HC Climb Simulation",
                        details: "Warm-up: 15 min. Main: 50 min climbing @ 75% FTP with 5x2 min surges @ 95% FTP. Cool-down: 15 min."
                    },
                    long: {
                        duration: 105,
                        displayName: "HC Climb Simulation (Extended)",
                        details: "Warm-up: 20 min. Main: 70 min climbing @ 75% FTP with 7x2 min surges @ 95% FTP. Cool-down: 15 min."
                    }
                }
            },
            {
                name: "Climbing Attack Intervals",
                description: "Explosive climbing attacks to drop the competition.",
                intensity: "100-110% FTP",
                tips: "These simulate attacks on climbs. Go from seated to standing explosively.",
                variants: {
                    short: {
                        duration: 45,
                        displayName: "Climbing Attack Intervals (Quick)",
                        details: "Warm-up: 12 min. Main: 4x3 min @ 100-110% FTP, 4 min recovery. Cool-down: 9 min."
                    },
                    medium: {
                        duration: 65,
                        displayName: "Climbing Attack Intervals",
                        details: "Warm-up: 15 min. Main: 5x4 min @ 100-110% FTP, 4 min recovery. Cool-down: 10 min."
                    },
                    long: {
                        duration: 85,
                        displayName: "Climbing Attack Intervals (Extended)",
                        details: "Warm-up: 15 min. Main: 6x5 min @ 100-110% FTP, 4 min recovery. Cool-down: 10 min."
                    }
                }
            }
        ]
    },

    // ========================================
    // GRAN FONDO - Endurance focused training
    // ========================================
    granfondo: {
        easy: [
            {
                name: "Base Miles",
                description: "Long steady endurance. Build your aerobic engine.",
                intensity: "60-70% FTP",
                tips: "This is about time in the saddle. Stay comfortable and conversational.",
                variants: {
                    short: {
                        duration: 90,
                        displayName: "Base Miles (Quick)",
                        details: "Warm-up: 15 min easy. Main: 70 min steady @ 60-70% FTP. Cool-down: 5 min."
                    },
                    medium: {
                        duration: 120,
                        displayName: "Base Miles",
                        details: "Warm-up: 15 min easy. Main: 100 min steady @ 60-70% FTP. Cool-down: 5 min."
                    },
                    long: {
                        duration: 180,
                        displayName: "Base Miles (Extended)",
                        details: "Warm-up: 15 min easy. Main: 160 min steady @ 60-70% FTP. Practice nutrition strategy. Cool-down: 5 min."
                    }
                }
            },
            {
                name: "Endurance Foundation",
                description: "Zone 2 all-day pace. Perfect for building base fitness.",
                intensity: "65-75% FTP",
                tips: "You should be able to hold a conversation. If you can't, slow down.",
                variants: {
                    short: {
                        duration: 75,
                        displayName: "Endurance Foundation (Quick)",
                        details: "Warm-up: 10 min. Main: 60 min Zone 2 @ 65-75% FTP. Cool-down: 5 min."
                    },
                    medium: {
                        duration: 120,
                        displayName: "Endurance Foundation",
                        details: "Warm-up: 15 min. Main: 100 min Zone 2 @ 65-75% FTP. Cool-down: 5 min."
                    },
                    long: {
                        duration: 180,
                        displayName: "Endurance Foundation (Extended)",
                        details: "Warm-up: 15 min. Main: 160 min Zone 2 @ 65-75% FTP. Simulate event conditions. Cool-down: 5 min."
                    }
                }
            },
            {
                name: "Recovery Spin",
                description: "Active recovery for between hard blocks.",
                intensity: "50-60% FTP",
                tips: "Super easy. High cadence, low resistance. This helps you recover.",
                variants: {
                    short: {
                        duration: 45,
                        displayName: "Recovery Spin (Quick)",
                        details: "Warm-up: 5 min. Main: 35 min @ 50-60% FTP, high cadence 90+ rpm. Just spin easy, no efforts. Cool-down: 5 min."
                    },
                    medium: {
                        duration: 60,
                        displayName: "Recovery Spin",
                        details: "Warm-up: 5 min. Main: 50 min @ 50-60% FTP, high cadence 90+ rpm. Minimal resistance, active recovery. Cool-down: 5 min."
                    },
                    long: {
                        duration: 90,
                        displayName: "Recovery Spin (Extended)",
                        details: "Warm-up: 5 min. Main: 80 min @ 50-60% FTP, high cadence 90+ rpm. Stay relaxed. Cool-down: 5 min."
                    }
                }
            }
        ],
        moderate: [
            {
                name: "Tempo Endurance",
                description: "Sustained tempo blocks. Gran fondo race pace.",
                intensity: "75-85% FTP",
                tips: "This is your gran fondo pace. Practice nutrition and pacing.",
                variants: {
                    short: {
                        duration: 75,
                        displayName: "Tempo Endurance (Quick)",
                        details: "Warm-up: 15 min. Main: 2x20 min @ 75-85% FTP, 5 min easy. Cool-down: 10 min."
                    },
                    medium: {
                        duration: 100,
                        displayName: "Tempo Endurance",
                        details: "Warm-up: 15 min. Main: 3x20 min @ 75-85% FTP, 5 min easy. Cool-down: 10 min."
                    },
                    long: {
                        duration: 135,
                        displayName: "Tempo Endurance (Extended)",
                        details: "Warm-up: 15 min. Main: 4x20 min @ 75-85% FTP, 5 min easy. Cool-down: 15 min."
                    }
                }
            },
            {
                name: "Sweet Spot Endurance",
                description: "Long sweet spot intervals for sustained power.",
                intensity: "88-92% FTP",
                tips: "This builds your ability to hold power for hours. Mental toughness workout.",
                variants: {
                    short: {
                        duration: 70,
                        displayName: "Sweet Spot Endurance (Quick)",
                        details: "Warm-up: 15 min. Main: 2x15 min @ 88-92% FTP, 5 min easy. Cool-down: 10 min."
                    },
                    medium: {
                        duration: 95,
                        displayName: "Sweet Spot Endurance",
                        details: "Warm-up: 15 min. Main: 3x15 min @ 88-92% FTP, 5 min easy. Cool-down: 10 min."
                    },
                    long: {
                        duration: 130,
                        displayName: "Sweet Spot Endurance (Extended)",
                        details: "Warm-up: 15 min. Main: 4x15 min @ 88-92% FTP, 5 min easy. Cool-down: 15 min."
                    }
                }
            },
            {
                name: "Fondo Simulation",
                description: "Varied pace simulating gran fondo terrain.",
                intensity: "Variable 70-90% FTP",
                tips: "Practice surging for hills, then settling back to tempo. Real-world pacing.",
                variants: {
                    short: {
                        duration: 90,
                        displayName: "Fondo Simulation (Quick)",
                        details: "Warm-up: 15 min. Main: Alternating 5 min @ 85% FTP, 10 min @ 70% FTP. Repeat 4x. Cool-down: 10 min."
                    },
                    medium: {
                        duration: 120,
                        displayName: "Fondo Simulation",
                        details: "Warm-up: 15 min. Main: Alternating 5 min @ 90% FTP, 10 min @ 70% FTP. Repeat 5x. Cool-down: 10 min."
                    },
                    long: {
                        duration: 150,
                        displayName: "Fondo Simulation (Extended)",
                        details: "Warm-up: 15 min. Main: Alternating 5 min @ 90% FTP, 15 min @ 70% FTP. Repeat 6x. Cool-down: 15 min."
                    }
                }
            }
        ],
        hard: [
            {
                name: "Threshold Endurance",
                description: "Long threshold efforts for race-winning power.",
                intensity: "95-100% FTP",
                tips: "This hurts. But this is what separates good from great in gran fondos.",
                variants: {
                    short: {
                        duration: 65,
                        displayName: "Threshold Endurance (Quick)",
                        details: "Warm-up: 15 min with 2x2 min builds. Main: 2x12 min @ 95-100% FTP, 6 min recovery. Cool-down: 10 min."
                    },
                    medium: {
                        duration: 85,
                        displayName: "Threshold Endurance",
                        details: "Warm-up: 15 min with 3x2 min builds. Main: 3x12 min @ 95-100% FTP, 6 min recovery. Cool-down: 10 min."
                    },
                    long: {
                        duration: 110,
                        displayName: "Threshold Endurance (Extended)",
                        details: "Warm-up: 15 min with 3x2 min builds. Main: 4x12 min @ 95-100% FTP, 7 min recovery. Cool-down: 15 min."
                    }
                }
            },
            {
                name: "Climb Repeats",
                description: "Simulated climb efforts for hilly gran fondos.",
                intensity: "90-100% FTP",
                tips: "Imagine you're climbing. Stay seated, grind it out. This builds climbing endurance.",
                variants: {
                    short: {
                        duration: 60,
                        displayName: "Climb Repeats (Quick)",
                        details: "Warm-up: 15 min. Main: 3x8 min @ 90-100% FTP (seated), 5 min recovery. Cool-down: 10 min."
                    },
                    medium: {
                        duration: 80,
                        displayName: "Climb Repeats",
                        details: "Warm-up: 15 min. Main: 4x8 min @ 90-100% FTP (seated), 5 min recovery. Cool-down: 15 min."
                    },
                    long: {
                        duration: 100,
                        displayName: "Climb Repeats (Extended)",
                        details: "Warm-up: 15 min. Main: 5x10 min @ 90-100% FTP (seated), 5 min recovery. Cool-down: 15 min."
                    }
                }
            },
            {
                name: "VO2 Max Builders",
                description: "Short VO2 efforts to build top-end for attacks.",
                intensity: "110-120% FTP",
                tips: "These are short and brutal. They give you the power to respond to attacks.",
                variants: {
                    short: {
                        duration: 50,
                        displayName: "VO2 Max Builders (Quick)",
                        details: "Warm-up: 15 min with builds. Main: 4x4 min @ 110-120% FTP, 4 min recovery. Cool-down: 10 min."
                    },
                    medium: {
                        duration: 65,
                        displayName: "VO2 Max Builders",
                        details: "Warm-up: 15 min with builds. Main: 5x4 min @ 110-120% FTP, 4 min recovery. Cool-down: 10 min."
                    },
                    long: {
                        duration: 85,
                        displayName: "VO2 Max Builders (Extended)",
                        details: "Warm-up: 15 min with builds. Main: 6x5 min @ 110-120% FTP, 4 min recovery. Cool-down: 10 min."
                    }
                }
            },
            {
                name: "Gran Fondo Race Day",
                description: "Full event simulation with varied efforts.",
                intensity: "Variable 55-110% FTP",
                tips: "Treat this like race day. Test everything. No surprises on event day.",
                variants: {
                    short: {
                        duration: 120,
                        displayName: "Gran Fondo Race Day (Quick)",
                        details: "Warm-up: 10 min. Main: 100 min race simulation (varied efforts: surges, climbs, tempo blocks). Practice race nutrition. Cool-down: 10 min."
                    },
                    medium: {
                        duration: 180,
                        displayName: "Gran Fondo Race Day",
                        details: "Warm-up: 10 min. Main: 160 min race simulation (varied efforts: climbs, descents, tempo blocks). Full race nutrition strategy. Cool-down: 10 min."
                    },
                    long: {
                        duration: 240,
                        displayName: "Gran Fondo Race Day (Extended)",
                        details: "Warm-up: 10 min. Main: 220 min race simulation (varied efforts: climbs, flats, attacks, tempo work). Full race day dress rehearsal. Cool-down: 10 min."
                    }
                }
            }
        ]
    }
};