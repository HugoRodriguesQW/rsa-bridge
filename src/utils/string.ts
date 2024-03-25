export default function f(text: string, code: BufferEncoding) {
  return {
    to: (newcode: BufferEncoding) => {
      return Buffer.alloc(text.length, text, code).toString(newcode);
    },
  };
}
