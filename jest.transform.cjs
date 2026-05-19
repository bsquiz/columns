const ts = require("typescript");

module.exports = {
  process(sourceText, sourcePath) {
    const result = ts.transpileModule(sourceText, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
      fileName: sourcePath,
    });

    return {
      code: result.outputText,
    };
  },
};
