// 把导入的模组文件读成纯文本，主站和图书馆共用。
// 支持 txt/md/json（UTF-8 或 GBK 编码都行）、docx、pdf；pdf.js 只在第一次读 PDF 时加载。
(function (root) {
    const vendorBase = new URL('../vendor/', document.currentScript.src).href;
    let pdfjs = null;
    const loadPdfJs = () => (pdfjs ||= import(`${vendorBase}pdf.min.js`).then((lib) => {
        lib.GlobalWorkerOptions.workerSrc = `${vendorBase}pdf.worker.min.js`;
        return lib;
    }));

    // 先按 UTF-8 解，解不开就按 GBK（Windows 记事本存的中文常见）
    const decodeText = (buf) => {
        try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch { return new TextDecoder('gb18030').decode(buf); }
    };

    const pdfToText = async (buf) => {
        const doc = await (await loadPdfJs()).getDocument({ data: buf }).promise;
        const pages = [];
        for (let i = 1; i <= doc.numPages; i++) {
            const { items } = await (await doc.getPage(i)).getTextContent();
            pages.push(items.map((it) => it.str + (it.hasEOL ? '\n' : '')).join(''));
        }
        // 有些 PDF 字体会把汉字导出成长得一样的部首符号（如「⽳」），换回正常汉字
        return pages.join('\n\n').replace(/[⺀-⿟]/g, (c) => c.normalize('NFKC'));
    };

    root.readModuleFile = async (file) => {
        const ext = file.name.toLowerCase().split('.').pop();
        if (ext === 'doc') throw new Error('旧版 .doc 文件读不了，请用 Word 或 WPS 另存为 .docx 再导入');
        if (['zip', 'rar', '7z'].includes(ext)) throw new Error('压缩包要先解压，再导入里面的文档');
        const buf = await file.arrayBuffer();
        if (ext === 'docx') return (await root.mammoth.extractRawText({ arrayBuffer: buf })).value;
        if (ext === 'pdf') {
            const text = await pdfToText(buf);
            if (text.replace(/\s/g, '').length < 50) throw new Error('这个 PDF 里几乎没有文字（可能是扫描的图片），读不出内容');
            return text;
        }
        return decodeText(buf);
    };
})(window);
