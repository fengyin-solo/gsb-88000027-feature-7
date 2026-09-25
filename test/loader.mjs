// 让 Node 直接运行测试时也能解析项目里 Vite 风格的无扩展名相对导入。
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context)
  } catch (error) {
    if (
      (specifier.startsWith('.') || specifier.startsWith('/')) &&
      !/\.[a-zA-Z0-9]+$/.test(specifier)
    ) {
      return nextResolve(`${specifier}.js`, context)
    }
    throw error
  }
}
