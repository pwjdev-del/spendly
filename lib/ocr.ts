"use client"

import Tesseract from 'tesseract.js'

export interface OCRResult {
    text: string
    confidence: number
}

export interface ReceiptData {
    merchant?: string
    amount?: number
    date?: string
    items?: string[]
    rawText: string
}

/**
 * Extract text from an image using Tesseract OCR
 */
export async function extractTextFromImage(imageUrl: string): Promise<OCRResult> {
    try {
        const result = await Tesseract.recognize(imageUrl, 'eng', {
            logger: (m) => console.log(m)
        })

        return {
            text: result.data.text,
            confidence: result.data.confidence
        }
    } catch (error) {
        console.error('OCR Error:', error)
        throw new Error('Failed to extract text from image')
    }
}

/**
 * Parse receipt text to extract structured data
 */
export function parseReceiptText(text: string): ReceiptData {
    const lines = text.split('\n').filter(line => line.trim())

    // Extract merchant (usually first non-empty line)
    const merchant = lines[0]?.trim()

    // Extract amount (look for patterns like $XX.XX or XX.XX)
    const amountPattern = /(?:\$|USD|Total[:\s]*)?(\d+\.\d{2})/gi
    const amounts: number[] = []
    text.match(amountPattern)?.forEach(match => {
        const num = parseFloat(match.replace(/[^\d.]/g, ''))
        if (num > 0) amounts.push(num)
    })
    const amount = amounts.length > 0 ? Math.max(...amounts) : undefined

    // Extract date (look for common date formats)
    const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/
    const dateMatch = text.match(datePattern)
    const date = dateMatch ? dateMatch[0] : undefined

    // Extract line items (lines with amounts)
    const items = lines.filter(line => /\d+\.\d{2}/.test(line))

    return {
        merchant,
        amount,
        date,
        items: items.length > 0 ? items : undefined,
        rawText: text
    }
}

/**
 * Process an uploaded receipt image
 */
export async function processReceipt(imageUrl: string): Promise<ReceiptData> {
    const ocrResult = await extractTextFromImage(imageUrl)
    return parseReceiptText(ocrResult.text)
}
