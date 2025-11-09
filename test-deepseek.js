async function testDeepSeekAPI() {
  const apiKey = process.env.DEEPSEEK_API_KEY || 'sk-345d3aa211c64eb1956fd087299c234f'
  const baseURL = 'https://api.deepseek.com/v1'

  console.log('🧪 测试DeepSeek API连接...')
  console.log(`API Key: ${apiKey.substring(0, 10)}...`)
  console.log(`Base URL: ${baseURL}`)

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: '你好，请简单介绍一下你自己。',
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ API调用失败:')
      console.error('状态码:', response.status)
      console.error('错误信息:', errorData)
      return
    }

    const data = await response.json()
    console.log('✅ API调用成功!')
    console.log('📄 响应内容:')
    console.log(data.choices[0].message.content)
    console.log('📊 使用情况:', data.usage)
  } catch (error) {
    console.error('❌ API调用失败:')
    console.error('网络错误:', error.message)
  }
}

testDeepSeekAPI()
