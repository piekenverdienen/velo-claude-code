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
                        details: "Just spin easy for 30 min. No efforts. This is recovery, not training."
                    },
                    medium: {
                        duration: 50,
                        displayName: "Active Recovery",
                        details: "Easy spin for 50 min. High cadence, minimal resistance throughout."
                    },
                    long: {
                        duration: 75,
                        displayName: "Active Recovery (Extended)",
                        details: "Long, easy spin. 75 min of pure recovery. Focus on smooth pedaling."
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
                        details: "Warm-up: 15 min progressive. Test: 2x6 min @ 100% FTP, 8 min recovery. Cool-down: 10 min."
                    },
                    medium: {
                        duration: 70,
                        displayName: "Polarized Power Test",
                        details: "Warm-up: 20 min progressive. Test: 2x8 min @ 100% FTP, 10 min recovery. Cool-down: easy spin."
                    },
                    long: {
                        duration: 85,
                        displayName: "Polarized Power Test (Extended)",
                        details: "Warm-up: 20 min progressive. Test: 2x12 min @ 100% FTP, 10 min recovery. Cool-down: 15 min."
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
                        details: "Increase resistance for 70-75 rpm cadence. Stay seated. 45 min total."
                    },
                    medium: {
                        duration: 75,
                        displayName: "Zone 1 Climb Sim",
                        details: "Increase resistance for 70-75 rpm cadence. Stay seated. Focus on form."
                    },
                    long: {
                        duration: 105,
                        displayName: "Zone 1 Climb Sim (Extended)",
                        details: "Extended climb simulation. 70-75 rpm. Stay seated entire time. Work on sustainability."
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
                        details: "Alternate 4 min @ 60 rpm and 4 min @ 90 rpm. Same power throughout."
                    },
                    medium: {
                        duration: 65,
                        displayName: "Cadence Climb Drills",
                        details: "Alternate 5 min @ 60 rpm and 5 min @ 90 rpm. Same power. Focus on efficiency."
                    },
                    long: {
                        duration: 90,
                        displayName: "Cadence Climb Drills (Extended)",
                        details: "Extended cadence work. 6 min blocks @ 60 rpm and 90 rpm. Maintain power."
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
                        details: "Maintain 65-70 rpm. Focus on smooth pedal stroke and core stability. 55 min."
                    },
                    medium: {
                        duration: 85,
                        displayName: "Seated Climbing Endurance",
                        details: "Extended seated work. 65-70 rpm. Perfect your climbing form."
                    },
                    long: {
                        duration: 115,
                        displayName: "Seated Climbing Endurance (Extended)",
                        details: "Long seated climb. 65-70 rpm throughout. Build climbing-specific endurance."
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
                        details: "After warm-up: 35 min climbing with 2 min @ 95% FTP every 8 min (steep sections). Cool-down: 10 min."
                    },
                    medium: {
                        duration: 80,
                        displayName: "HC Climb Simulation",
                        details: "After warm-up: 50 min climbing with 2 min @ 95% FTP every 10 min (steep sections). Cool-down: 15 min."
                    },
                    long: {
                        duration: 105,
                        displayName: "HC Climb Simulation (Extended)",
                        details: "After warm-up: 70 min climbing with 2 min @ 95% FTP every 10 min (steep sections). Cool-down: 15 min."
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
    
    granfondo: {
        easy: [
            {
                name: "Long Zone 1 Ride",
                description: "Extended easy pace. Practice your nutrition.",
                intensity: "60-65% FTP",
                tips: "This is your Gran Fondo foundation. Time in the saddle matters.",
                variants: {
                    short: {
                        duration: 75,
                        displayName: "Long Zone 1 Ride (Quick)",
                        details: "Eat every 30 min. Drink every 15 min. Maintain steady Zone 1. 75 min."
                    },
                    medium: {
                        duration: 120,
                        displayName: "Long Zone 1 Ride",
                        details: "Extended endurance ride. Eat every 30 min. Drink every 15 min. Steady Zone 1."
                    },
                    long: {
                        duration: 165,
                        displayName: "Long Zone 1 Ride (Extended)",
                        details: "Long endurance build. Practice all race day nutrition. Steady Zone 1 throughout."
                    }
                }
            },
            {
                name: "Recovery Endurance",
                description: "Active recovery with endurance focus.",
                intensity: "55-60% FTP",
                tips: "Perfect for the day after hard efforts. Promotes adaptation.",
                variants: {
                    short: {
                        duration: 45,
                        displayName: "Recovery Endurance (Quick)",
                        details: "Easy aerobic ride. Should feel too easy. High cadence. 45 min."
                    },
                    medium: {
                        duration: 75,
                        displayName: "Recovery Endurance",
                        details: "Pure aerobic ride. Should feel too easy. High cadence throughout."
                    },
                    long: {
                        duration: 105,
                        displayName: "Recovery Endurance (Extended)",
                        details: "Extended recovery ride. Easy effort, high cadence. Build endurance base."
                    }
                }
            },
            {
                name: "Fondo Base Miles",
                description: "Building the endurance foundation for long events.",
                intensity: "65-70% FTP",
                tips: "This is about time, not intensity. Build gradually to avoid overtraining.",
                variants: {
                    short: {
                        duration: 80,
                        displayName: "Fondo Base Miles (Quick)",
                        details: "Steady Zone 2 ride. Practice eating and drinking. Some gentle rolling terrain."
                    },
                    medium: {
                        duration: 130,
                        displayName: "Fondo Base Miles",
                        details: "Extended Zone 2. Practice eating and drinking on the bike. Include some gentle rolling terrain."
                    },
                    long: {
                        duration: 180,
                        displayName: "Fondo Base Miles (Extended)",
                        details: "Long endurance ride. Zone 2 throughout. Full race day nutrition practice."
                    }
                }
            }
        ],
        moderate: [
            {
                name: "Fondo Tempo",
                description: "Race pace simulation with fueling practice.",
                intensity: "75-80% FTP",
                tips: "This is your Gran Fondo pace. Get comfortable being uncomfortable.",
                variants: {
                    short: {
                        duration: 60,
                        displayName: "Fondo Tempo (Quick)",
                        details: "Warm-up: 10 min. Main: 2x15 min @ 75-80% FTP, 8 min recovery. Practice eating/drinking. Cool-down: 10 min."
                    },
                    medium: {
                        duration: 90,
                        displayName: "Fondo Tempo",
                        details: "Warm-up: 15 min. Main: 2x25 min @ 75-80% FTP, 10 min recovery. Practice eating/drinking during efforts. Cool-down: 15 min."
                    },
                    long: {
                        duration: 120,
                        displayName: "Fondo Tempo (Extended)",
                        details: "Warm-up: 15 min. Main: 3x25 min @ 75-80% FTP, 10 min recovery. Full nutrition practice. Cool-down: 15 min."
                    }
                }
            },
            {
                name: "Variable Pace Training",
                description: "Simulate group riding dynamics.",
                intensity: "65-85% FTP",
                tips: "Mimics the surges in group rides. Learn to recover while still pedaling.",
                variants: {
                    short: {
                        duration: 65,
                        displayName: "Variable Pace Training (Quick)",
                        details: "After warm-up: Alternate 8 min @ 65% with 4 min @ 85% FTP. Repeat. Cool-down: 15 min."
                    },
                    medium: {
                        duration: 100,
                        displayName: "Variable Pace Training",
                        details: "After warm-up: Alternate 10 min @ 65% with 5 min @ 85% FTP. Repeat throughout ride. Cool-down: 15 min."
                    },
                    long: {
                        duration: 135,
                        displayName: "Variable Pace Training (Extended)",
                        details: "Extended variable pace. 10 min @ 65%, 5 min @ 85% FTP. Learn to recover on the bike. Cool-down: 15 min."
                    }
                }
            },
            {
                name: "Endurance Threshold",
                description: "Extended time at moderate intensity.",
                intensity: "70-75% FTP",
                tips: "This builds fatigue resistance. Focus on perfect form as you tire.",
                variants: {
                    short: {
                        duration: 75,
                        displayName: "Endurance Threshold (Quick)",
                        details: "Warm-up: 15 min. Main: 45 min steady @ 70-75% FTP. Cool-down: 15 min easy."
                    },
                    medium: {
                        duration: 110,
                        displayName: "Endurance Threshold",
                        details: "Warm-up: 20 min. Main: 70 min steady @ 70-75% FTP. Cool-down: 20 min easy."
                    },
                    long: {
                        duration: 145,
                        displayName: "Endurance Threshold (Extended)",
                        details: "Warm-up: 20 min. Main: 100 min steady @ 70-75% FTP. Cool-down: 25 min easy."
                    }
                }
            }
        ],
        hard: [
            {
                name: "Gran Fondo Specific",
                description: "Full event simulation with efforts.",
                intensity: "Variable 60-100% FTP",
                tips: "Practice everything: pacing, nutrition, hydration, mental strategies.",
                variants: {
                    short: {
                        duration: 75,
                        displayName: "Gran Fondo Specific (Quick)",
                        details: "Include 2x8 min @ 90-100% FTP within a 75 min ride. Simulate race dynamics."
                    },
                    medium: {
                        duration: 120,
                        displayName: "Gran Fondo Specific",
                        details: "Include 3x8 min @ 90-100% FTP within a long ride. Simulate race dynamics. Full nutrition."
                    },
                    long: {
                        duration: 165,
                        displayName: "Gran Fondo Specific (Extended)",
                        details: "Extended event simulation. 4x8 min @ 90-100% FTP. Full race day practice."
                    }
                }
            },
            {
                name: "Endurance Power Intervals",
                description: "Long intervals to build sustained power.",
                intensity: "85-95% FTP",
                tips: "These hurt in a different way. It's about mental toughness.",
                variants: {
                    short: {
                        duration: 65,
                        displayName: "Endurance Power Intervals (Quick)",
                        details: "Warm-up: 15 min. Main: 2x15 min @ 85-95% FTP, 7 min recovery. Cool-down: 15 min."
                    },
                    medium: {
                        duration: 100,
                        displayName: "Endurance Power Intervals",
                        details: "Warm-up: 20 min. Main: 3x15 min @ 85-95% FTP, 7 min recovery. Cool-down: 20 min."
                    },
                    long: {
                        duration: 135,
                        displayName: "Endurance Power Intervals (Extended)",
                        details: "Warm-up: 20 min. Main: 4x15 min @ 85-95% FTP, 7 min recovery. Cool-down: 20 min."
                    }
                }
            },
            {
                name: "Race Simulation",
                description: "Full Gran Fondo race simulation.",
                intensity: "Variable 55-110% FTP",
                tips: "Treat this like race day. Test everything. No surprises on event day.",
                variants: {
                    short: {
                        duration: 90,
                        displayName: "Race Simulation (Quick)",
                        details: "Compressed race sim. Include climbs, efforts, steady sections. Practice race nutrition."
                    },
                    medium: {
                        duration: 130,
                        displayName: "Race Simulation",
                        details: "Full race simulation. Climbs, descents, attacks, steady sections. Full race nutrition strategy."
                    },
                    long: {
                        duration: 180,
                        displayName: "Race Simulation (Extended)",
                        details: "Extended race simulation. Everything: climbs, descents, attacks, steady work. Full race day dress rehearsal."
                    }
                }
            }
        ]
    }
};