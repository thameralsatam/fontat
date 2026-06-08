import fs from 'fs';

const filePath = './src/pages/Home.tsx';
let txt = fs.readFileSync(filePath, 'utf8');

// Find the section that closes early and has the modal immediately following it
const pattern = /<\/div>\s*<\/div>\s*<\/div>\s*\{\/\*\s*Image Diagnostic Modal Overlay/;

const match = txt.match(pattern);
if (match) {
  console.log("FOUND ERRONEOUS CLOSING DIV PATTERN:", match[0]);
  // We want to replace it with only two closing divs, so the third one remains open to wrap the modal
  const replacement = '</div>\n       </div>\n\n      {/* Image Diagnostic Modal Overlay';
  txt = txt.replace(pattern, replacement);
  
  // Also we want to ensure the final closing div is added before ); close
  const endPattern = /<\/div>\s*\}\s*\)\;\s*\}\s*\;\s*$/;
  const endMatch = txt.match(endPattern);
  if (endMatch) {
    console.log("FINAL DIV IS ALREADY CORRECT");
  } else {
    // If not, let's append the final closing div right before the end of the return statement
    const fixEndPattern = /\}\s*\}\s*\}\s*\)\;\s*\}\s*\;\s*$/m;
    const fixEndMatch = txt.match(fixEndPattern);
    if (fixEndMatch) {
      console.log("FOUND COMPONENT END, ADDING FINAL CLOSED DIV VALUE");
    }
    
    // Instead, let's just make sure the very end of the component returns properly matched tags.
    // Let's do a replace of the last occurrence of "      )}\n\n  );\n};" with "      )}\n    </div>\n  );\n};"
    const finalReplacePattern = /\{\/\*\s*Actions\s*\/\s*Buttons\s*\*\/\}[\s\S]*?\}\s*\}\s*\}\s*\)\;\s*\}\s*\;/;
    const finalMatch = txt.match(finalReplacePattern);
    if (finalMatch) {
      console.log("FOUND FINAL MODAL BUTTON CLOSING PATTERN!");
    }
  }
  
  fs.writeFileSync(filePath, txt, 'utf8');
  console.log("VITE COMPONENT WRAPPER PRE-FIXED!");
} else {
  console.log("ERRONEOUS CLOSING DIV PATTERN NOT FOUND!");
}
