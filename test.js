import { GoogleGenerativeAI } from '@google/generative-ai'

const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

function base64ToGenerativePart(base64DataUrl) {
  const base64String = base64DataUrl.split(',')[1]
  const mimeType = base64DataUrl.substring(base64DataUrl.indexOf(':') + 1, base64DataUrl.indexOf(';'))
  return {
    inlineData: {
      data: base64String,
      mimeType
    }
  }
}

async function test() {
  const apiKey = 'AIzaSyA_INvALID_KEY_1234567890abcdef' // INVALID

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    }
  })

  const prompt = `Return {"found": false}`
  const imagePart = base64ToGenerativePart(dummyBase64)
  
  try {
    const result = await model.generateContent([prompt, imagePart])
    console.log(result.response.text())
  } catch (err) {
    console.error('GEMINI ERROR:', err.message)
  }
}

test()
