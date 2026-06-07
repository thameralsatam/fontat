import fs from 'fs';

const filePath = 'src/pages/Home.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// --- Part 1: Fix Feature 1 ---
// Let's identify lines 297 to 313 specifically.
const lines = code.split(/\r?\n/);

const feature1Start = lines.findIndex(l => l.includes('{/* Feature 1 - Left Panel */}'));
if (feature1Start !== -1) {
  console.log('Feature 1 panel start found at index:', feature1Start);
  
  // We want to verify lines 297 (0-indexed indices around feature1Start + 7) contain "{/* Search Box */}"
  // and line ~313 contains "{filteredTelegram.map"
  const searchBoxIndex = lines.indexOf('            {/* Search Box */}', feature1Start);
  const gridMapIndex = lines.indexOf('            {filteredTelegram.map((entity) => {', feature1Start);
  
  if (searchBoxIndex !== -1 && gridMapIndex !== -1) {
    console.log(`Indices found - SearchBox: ${searchBoxIndex}, Map: ${gridMapIndex}`);
    
    // We replace searchBoxIndex through gridMapIndex + 1 (the </div> line) with the proper Compass logo and relative-10 container
    lines.splice(searchBoxIndex, (gridMapIndex + 1) - searchBoxIndex + 1,
`            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-white group-hover:bg-white/10 transition-colors duration-300">
                <Compass className="w-6 h-6" />
              </div>`
    );
    console.log('Feature 1 restored inside lines array!');
  } else {
    console.error('Failed to locate searchBoxIndex or gridMapIndex in Feature 1.');
  }
}

// Join the code back to run Part 2
code = lines.join('\n');

// --- Part 2: Fix Telegram Directory search box ---
const oldPart2 = `            {/* Search Box */}
            <div className="rela          {/* Channels/Groups Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
             {filteredTelegram.map((entity) => {`;

const newPart2 = `            {/* Search Box */}
            <div className="relative w-full md:max-w-xs font-sans">
              <input
                type="text"
                value={telegramSearch}
                onChange={(e) => setTelegramSearch(e.target.value)}
                placeholder={language === 'ar' ? 'ابحث باسم القناة أو المعرف...' : 'Search name or user...'}
                className="w-full pl-9 pr-9 py-2.5 bg-[#0c0c0c] border border-white/10 hover:border-white/20 rounded-xl text-white text-xs outline-none focus:border-[#2AABEE]/40 focus:bg-[#070707] transition-all"
              />
              <Search className={\`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 \${dir === 'rtl' ? 'right-3' : 'left-3'}\`} />
            </div>
          </div>

          {/* Channels/Groups Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTelegram.map((entity) => {`;

if (code.includes('className="rela')) {
  // Let us replace using regex or exact substring to avoid any whitespace issue
  const testLines = code.split(/\r?\n/);
  const targetIndex = testLines.findIndex(l => l.includes('className="rela'));
  if (targetIndex !== -1) {
    console.log('Found Part 2 search target at index:', targetIndex);
    testLines.splice(targetIndex - 1, 4, newPart2);
    code = testLines.join('\n');
    console.log('Part 2 search replaced successfully!');
  }
} else {
  console.log('Warning: Part 2 target substring not found.');
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('superFix completed!');
