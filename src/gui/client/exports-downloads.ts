export function exportsDownloadsJs(): string {
  return `
      // Minimal store-method ZIP writer (no deps) so "Download all" yields a real .zip.
      function crc32(bytes) {
        var table = crc32._t;
        if (!table) {
          table = crc32._t = [];
          for (var n = 0; n < 256; n++) {
            var c = n;
            for (var k = 0; k < 8; k++) { c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); }
            table[n] = c >>> 0;
          }
        }
        var crc = 0xFFFFFFFF;
        for (var i = 0; i < bytes.length; i++) { crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xFF]; }
        return (crc ^ 0xFFFFFFFF) >>> 0;
      }
      function zipBlob(files) {
        var enc = new TextEncoder();
        var u16 = function(n) { return [n & 0xFF, (n >> 8) & 0xFF]; };
        var u32 = function(n) { return [n & 0xFF, (n >> 8) & 0xFF, (n >> 16) & 0xFF, (n >> 24) & 0xFF]; };
        var chunks = [], central = [], offset = 0;
        files.forEach(function(f) {
          var nameBytes = enc.encode(f.name);
          var data = enc.encode(String(f.content || ''));
          var crc = crc32(data);
          var local = [].concat(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0));
          var localArr = new Uint8Array(local);
          chunks.push(localArr, nameBytes, data);
          var cen = [].concat(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset));
          central.push({ header: new Uint8Array(cen), name: nameBytes });
          offset += localArr.length + nameBytes.length + data.length;
        });
        var centralStart = offset, centralSize = 0;
        central.forEach(function(c) { chunks.push(c.header, c.name); centralSize += c.header.length + c.name.length; });
        chunks.push(new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(centralSize), u32(centralStart), u16(0))));
        var total = chunks.reduce(function(s, c) { return s + c.length; }, 0);
        var out = new Uint8Array(total), pos = 0;
        chunks.forEach(function(c) { out.set(c, pos); pos += c.length; });
        return new Blob([out], { type: 'application/zip' });
      }

      function buildAiPrompt(target, exportData) {
        const site = exportData && exportData.url ? exportData.url : '';
        const thesis = exportData && exportData.thesis ? exportData.thesis : '';
        const cssVars = exportData && exportData.cssVars ? exportData.cssVars : '';
        const tailwind = exportData && exportData.tailwindTheme ? exportData.tailwindTheme : '';
        const tokens = exportData && exportData.jsonTokens ? exportData.jsonTokens : '';
        const assistant = aiTargetLabel(target);

        return [
          'Assistant: ' + assistant,
          'Task: Recreate and extend the target website style in a production UI.',
          '',
          'Source Site',
          site,
          '',
          'Style Thesis',
          thesis,
          '',
          'Instructions',
          '1. Keep the visual tone, hierarchy, and spacing rhythm faithful to the thesis.',
          '2. Use the provided token outputs as the source of truth.',
          '3. Build accessible UI with clear contrast and responsive layouts.',
          '4. Do not add colors or fonts not present in the token set unless explicitly noted.',
          '5. Return implementation-ready code and call out any assumptions.',
          '',
          'CSS Variables',
          cssVars,
          '',
          'Tailwind v4 Theme',
          tailwind,
          '',
          'JSON Tokens',
          tokens,
        ].join('\\n');
      }

      function downloadText(filename, content, mimeType) {
        const blob = new Blob([String(content || '')], { type: mimeType || 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      }

      function activeDownloadPayload() {
        if (!latestExportData) return null;
        if (activeExportTab === 'css') {
          return {
            filename: 'style-variables.css',
            content: latestExportData.cssVars,
            mimeType: 'text/css;charset=utf-8',
            label: '.css',
          };
        }
        if (activeExportTab === 'tailwind') {
          return {
            filename: 'tailwind-theme.css',
            content: latestExportData.tailwindTheme,
            mimeType: 'text/css;charset=utf-8',
            label: '.css',
          };
        }
        if (activeExportTab === 'json') {
          return {
            filename: 'design-tokens.json',
            content: latestExportData.jsonTokens,
            mimeType: 'application/json;charset=utf-8',
            label: '.json',
          };
        }
        if (activeExportTab === 'prompt') {
          return {
            filename: 'ai-prompt.txt',
            content: latestExportData.aiPrompt,
            mimeType: 'text/plain;charset=utf-8',
            label: '.txt',
          };
        }
        return {
          filename: 'DESIGN.md',
          content: latestExportData.designMd,
          mimeType: 'text/markdown;charset=utf-8',
          label: '.md',
        };
      }

      function updateActiveDownloadLabel() {
        if (!downloadActive) return;
        const payload = activeDownloadPayload();
        downloadActive.textContent = payload ? payload.label : '.md';
      }

      function attachDownloadHandlers() {
        const downloadBundleFile = () => {
          if (!latestExportData) return;
          const blob = zipBlob([
            { name: 'DESIGN.md', content: latestExportData.designMd },
            { name: 'style-variables.css', content: latestExportData.cssVars },
            { name: 'tailwind-theme.css', content: latestExportData.tailwindTheme },
            { name: 'design-tokens.json', content: latestExportData.jsonTokens },
            { name: 'ai-prompt.txt', content: latestExportData.aiPrompt },
          ]);
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = 'design-bundle.zip';
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          URL.revokeObjectURL(url);
        };

        if (downloadActive) {
          downloadActive.addEventListener('click', () => {
            const payload = activeDownloadPayload();
            if (!payload) return;
            downloadText(payload.filename, payload.content, payload.mimeType);
          });
        }

        if (downloadBundleTop) {
          downloadBundleTop.addEventListener('click', downloadBundleFile);
        }

        if (downloadDesign) {
          downloadDesign.addEventListener('click', () => {
            if (!latestExportData) return;
            downloadText('DESIGN.md', latestExportData.designMd, 'text/markdown;charset=utf-8');
          });
        }

        if (downloadCss) {
          downloadCss.addEventListener('click', () => {
            if (!latestExportData) return;
            downloadText('style-variables.css', latestExportData.cssVars, 'text/css;charset=utf-8');
          });
        }

        if (downloadTailwind) {
          downloadTailwind.addEventListener('click', () => {
            if (!latestExportData) return;
            downloadText('tailwind-theme.css', latestExportData.tailwindTheme, 'text/css;charset=utf-8');
          });
        }

        if (downloadJson) {
          downloadJson.addEventListener('click', () => {
            if (!latestExportData) return;
            downloadText('design-tokens.json', latestExportData.jsonTokens, 'application/json;charset=utf-8');
          });
        }

        if (downloadPrompt) {
          downloadPrompt.addEventListener('click', () => {
            if (!latestExportData) return;
            downloadText('ai-prompt.txt', latestExportData.aiPrompt, 'text/plain;charset=utf-8');
          });
        }

        if (downloadBundle) {
          downloadBundle.addEventListener('click', () => {
            downloadBundleFile();
          });
        }
      }
  `;
}
