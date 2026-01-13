
// Ported from legacy config.js
// This maps simple access codes to judge roles/stations

export const JUDGE_KEYS = {
    // Speed
    "ss1": { event: "speed", station: 1 },
    "ss2": { event: "speed", station: 2 },
    "ss3": { event: "speed", station: 3 },
    "ss4": { event: "speed", station: 4 },
    "ss5": { event: "speed", station: 5 },
    "ss6": { event: "speed", station: 6 },
    "ss7": { event: "speed", station: 7 },
    "ss8": { event: "speed", station: 8 },
    "ss9": { event: "speed", station: 9 },
    "ss10": { event: "speed", station: 10 },
    "ss11": { event: "speed", station: 11 },
    "ss12": { event: "speed", station: 12 },

    // Freestyle Station 1
    "fd1": { event: "freestyle", station: 1, judgeType: "difficulty" },
    "fr1": { event: "freestyle", station: 1, judgeType: "re" },
    "ft1": { event: "freestyle", station: 1, judgeType: "technical" },
    "fp1": { event: "freestyle", station: 1, judgeType: "presentation" },

    // Freestyle Station 2
    "fd2": { event: "freestyle", station: 2, judgeType: "difficulty" },
    "fr2": { event: "freestyle", station: 2, judgeType: "re" },
    "ft2": { event: "freestyle", station: 2, judgeType: "technical" },
    "fp2": { event: "freestyle", station: 2, judgeType: "presentation" },

    // Freestyle Station 3
    "fd3": { event: "freestyle", station: 3, judgeType: "difficulty" },
    "fr3": { event: "freestyle", station: 3, judgeType: "re" },
    "ft3": { event: "freestyle", station: 3, judgeType: "technical" },
    "fp3": { event: "freestyle", station: 3, judgeType: "presentation" },
};

export const ADMIN_KEY = "admin123";
export const IMPORTER_KEY = "import123"; // Valid key for importer access
export const TESTER_KEY = "88888888"; // Valid key for tester access
