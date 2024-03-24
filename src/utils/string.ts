export default function f(text: string, format: BufferEncoding) {
  return {
    to: (newFormat: BufferEncoding) => {
      return Buffer.alloc(text.length, text, format).toString(newFormat);
    },
  };
}
