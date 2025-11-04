declare module "mammoth/mammoth.browser.js" {
  type ExtractResult = { value: string };
  const mammoth: {
    extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<ExtractResult>;
  };
  export default mammoth;
}
