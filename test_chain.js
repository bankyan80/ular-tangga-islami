const hg = {92:88,75:67,57:43,39:22,23:17};
const bg = {21:41,31:50,35:47,62:82,66:75,69:72,86:95,90:91,79:82};
const q3 = {5:10,9:18,14:16,38:41,97:94,84:79,40:35,22:17,34:37,56:60};

function resolve(S) {
    let d = S;
    for (let hop = 0; hop < 5; hop++) {
        let R = 0, kind = '';
        if (hg[d]) { R = hg[d]; kind = 's'; }
        else if (bg[d]) { R = bg[d]; kind = 'l'; }
        else if (q3[d]) { R = q3[d]; kind = 'b'; }
        else break;
        d = R;
    }
    return d;
}

const cases = [
    [40, 47, 'bonus 40->35 then ladder 35->47'],
    [84, 82, 'bonus 84->79 then ladder 79->82'],
    [66, 67, 'ladder 66->75 then snake 75->67'],
    [39, 17, 'snake 39->22 then bonus 22->17'],
    [21, 41, 'ladder only'],
    [62, 82, 'ladder only'],
    [79, 82, 'mid blue ladder climbs'],
    [35, 47, 'ladder only'],
    [75, 67, 'snake only'],
    [92, 88, 'snake only'],
    [86, 95, 'ladder only'],
    [90, 91, 'ladder only'],
    [5, 10, 'bonus only'],
];

let pass = 0, fail = 0;
for (const [input, expected, desc] of cases) {
    const got = resolve(input);
    if (got === expected) { pass++; console.log(`PASS ${input} -> ${got} (${desc})`); }
    else { fail++; console.log(`FAIL ${input} -> ${got} expected ${expected} (${desc})`); }
}

// stability: resolving final position should be idempotent (no further hops)
for (const [input, expected] of cases) {
    const again = resolve(expected);
    if (again !== expected) { fail++; console.log(`FAIL unstable: final ${expected} -> ${again}`); }
    else pass++;
}

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
