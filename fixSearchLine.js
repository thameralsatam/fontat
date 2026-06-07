import fs from 'fs';

const filePath = 'src/pages/Home.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const targetSubstr = 'className="rela';
const pos = code.indexOf(targetSubstr);

if (pos !== -1) {
  const lines = code.split(/\r?\n/);
  const index = lines.findIndex(l => l.includes(targetSubstr));
  console.log('Target line index:', index);
  console.log('Line content:', lines[index]);

  // We replace from index - 1 to index + 2
  lines.splice(index - 1, 4, 
`            {/* Search Box */}
            <div className="relative w-full md:max-w-xs">
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
            {filteredTelegram.map((entity) => {`
  );

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Search Box & Grid restored successfully!');
} else {
  console.log('Target substring to replace was not found.');
}
