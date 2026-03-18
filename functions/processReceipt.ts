import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const startTime = Date.now();
  const debug = { steps: [], timings: {}, errors: [] };
  let receiptId = null;
  
  try {
    debug.steps.push('init');
    
    // Step 1: Authenticate
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ 
        error: 'Unauthorized - authentication required',
        step: 'auth'
      }, { status: 401 });
    }
    debug.steps.push('auth_ok');

    // Step 2: Validate input
    let payload;
    try {
      payload = await req.json();
    } catch (parseError) {
      return Response.json({ 
        error: 'Invalid request body - expected JSON',
        step: 'parse_input'
      }, { status: 400 });
    }

    receiptId = payload.receiptId;
    const imageUrl = payload.imageUrl;

    if (!receiptId) {
      return Response.json({ 
        error: 'Missing receiptId parameter',
        step: 'validate_input'
      }, { status: 400 });
    }

    if (!imageUrl) {
      // Mark receipt as failed - use user context since we have auth
      try {
        await base44.entities.Receipt.update(receiptId, {
          status: 'failed',
          processing_finished_at: new Date().toISOString(),
          processing_error: 'Receipt image not available',
          processing_debug: JSON.stringify({ step: 'validate_input', error: 'missing_image_url' })
        });
      } catch (e) {
        // Silent fail
      }
      
      return Response.json({ 
        error: 'Missing imageUrl parameter',
        step: 'validate_input'
      }, { status: 400 });
    }

    debug.steps.push('input_validated');
    debug.receiptId = receiptId;
    debug.imageUrl = imageUrl.substring(0, 100) + '...';

    // Step 3: Verify receipt ownership and exists
    debug.steps.push('verify_ownership');
    let receipt;
    try {
      const receipts = await base44.entities.Receipt.filter({ id: receiptId });
      if (!receipts || receipts.length === 0) {
        throw new Error('Receipt not found');
      }
      receipt = receipts[0];
      
      // Verify ownership
      if (receipt.created_by !== user.email) {
        return Response.json({ 
          error: 'Receipt not found or access denied',
          step: 'verify_ownership'
        }, { status: 403 });
      }
      
      debug.steps.push('ownership_verified');
    } catch (verifyError) {
      throw new Error(`Receipt verification failed: ${verifyError.message}`);
    }

    // Step 4: Set processing status
    debug.steps.push('set_processing_status');
    try {
      await base44.entities.Receipt.update(receiptId, {
        status: 'processing',
        processing_started_at: new Date().toISOString(),
        processing_error: null,
        processing_debug: null,
      });
      debug.timings.status_set = Date.now() - startTime;
      debug.steps.push('status_processing_set');
    } catch (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    // Step 4: Validate image URL format
    debug.steps.push('validate_image_url');
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      throw new Error('Invalid image URL format');
    }

    // Step 5: Run OCR
    debug.steps.push('call_ocr');
    const ocrStart = Date.now();
    let ocrResult;
    
    try {
      ocrResult = await Promise.race([
        base44.integrations.Core.InvokeLLM({
          prompt: `Extract ALL text from this receipt image. Return exactly what you see, including:
- Store/merchant name (usually at the top)
- Transaction date
- All prices and amounts
- Subtotal, tax, and TOTAL amount
- Any other visible text

Be thorough and accurate. Extract everything you can read.`,
          file_urls: [imageUrl],
          response_json_schema: {
            type: "object",
            properties: {
              raw_text: { type: "string" }
            },
            required: ["raw_text"]
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OCR timeout after 45 seconds')), 45000)
        )
      ]);
      
      debug.timings.ocr_ms = Date.now() - ocrStart;
      debug.steps.push('ocr_complete');
      debug.ocr = { 
        ok: true, 
        provider: 'base44_llm',
        textLength: ocrResult?.raw_text?.length || 0
      };
      
    } catch (ocrError) {
      debug.timings.ocr_ms = Date.now() - ocrStart;
      debug.steps.push('ocr_failed');
      
      // Extract detailed error info
      const errorDetails = {
        message: ocrError.message,
        name: ocrError.name,
        code: ocrError.code,
        response: ocrError.response ? {
          status: ocrError.response.status,
          statusText: ocrError.response.statusText,
          data: typeof ocrError.response.data === 'string' 
            ? ocrError.response.data.substring(0, 200)
            : ocrError.response.data
        } : null
      };
      
      debug.ocr = { ok: false, error: errorDetails };
      
      // Determine user-facing error message
      let userError = 'OCR extraction failed';
      if (ocrError.message.includes('timeout')) {
        userError = 'OCR timed out. Please retry with a clearer photo.';
      } else if (ocrError.response?.status === 401 || ocrError.response?.status === 403) {
        userError = 'OCR authorization failed. Please contact support.';
      } else if (ocrError.response?.status === 413) {
        userError = 'Image too large. Please upload a smaller photo.';
      } else if (ocrError.response?.status === 404) {
        userError = 'OCR service not available. Please try again later.';
      } else {
        userError = `OCR failed: ${ocrError.message}`;
      }
      
      throw new Error(userError);
    }

    // Step 6: Validate OCR output
    const ocrText = ocrResult.raw_text || '';
    debug.steps.push('validate_ocr_output');
    
    if (!ocrText || ocrText.trim().length < 10) {
      throw new Error('Could not extract readable text from receipt. Please try a clearer photo.');
    }

    // Step 7: Parse receipt data
    debug.steps.push('parse_receipt');
    const parseStart = Date.now();
    let parseResult;

    try {
      parseResult = await Promise.race([
        base44.integrations.Core.InvokeLLM({
          prompt: `Parse this receipt text and extract structured data:

${ocrText}

Extract these fields carefully:
- merchantName: The store/restaurant name (usually at the top of receipt)
- date: Transaction date in YYYY-MM-DD format (look for "Date:", "DD/MM/YYYY", etc.)
- currency: EUR, USD, QAR, SAR, GBP (look for € $ symbols or currency codes)
- subtotal: Amount before tax if shown (look for "Subtotal", "Sub Total")
- tax: Tax/VAT amount if shown (look for "Tax", "VAT", "GST")
- total: FINAL total paid - this is CRITICAL (look for "Total", "Total Paid", "Amount Due", "Grand Total")
- confidence: Your confidence 0-100 in extraction accuracy

IMPORTANT:
- total must be the FINAL amount the customer paid
- If you see multiple amounts, pick the one labeled as the final total
- merchantName cannot be empty
- If information is unclear, set confidence lower`,
          response_json_schema: {
            type: "object",
            properties: {
              merchantName: { type: "string" },
              date: { type: "string" },
              currency: { type: "string" },
              subtotal: { type: "number" },
              tax: { type: "number" },
              total: { type: "number" },
              confidence: { type: "number" }
            },
            required: ["merchantName", "total", "confidence"]
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Parsing timeout after 30 seconds')), 30000)
        )
      ]);

      debug.timings.parse_ms = Date.now() - parseStart;
      debug.steps.push('parse_complete');
      debug.parse = { 
        ok: true,
        merchantName: parseResult.merchantName,
        total: parseResult.total,
        confidence: parseResult.confidence
      };
      
    } catch (parseError) {
      debug.timings.parse_ms = Date.now() - parseStart;
      debug.steps.push('parse_failed');
      debug.parse = { ok: false, error: parseError.message };
      throw new Error(`Failed to parse receipt: ${parseError.message}`);
    }

    // Step 8: Validate parsed data
    debug.steps.push('validate_parsed_data');
    
    if (!parseResult.merchantName || parseResult.merchantName.trim() === '') {
      throw new Error('Could not find merchant name on receipt. Please edit manually.');
    }
    
    if (!parseResult.total || parseResult.total <= 0) {
      throw new Error('Could not find total amount on receipt. Please edit manually.');
    }

    // Step 9: Suggest category
    debug.steps.push('suggest_category');
    const { category, subCategory } = suggestCategory(parseResult.merchantName);

    const parsedData = {
      merchantName: parseResult.merchantName,
      date: parseResult.date || new Date().toISOString().split('T')[0],
      currency: parseResult.currency || 'USD',
      subtotal: parseResult.subtotal || 0,
      tax: parseResult.tax || 0,
      total: parseResult.total,
      confidence: parseResult.confidence || 0,
      suggestedCategory: category,
      suggestedSubCategory: subCategory
    };

    // Step 10: Update receipt with results
    debug.steps.push('save_results');
    const totalTime = Date.now() - startTime;
    debug.timings.total_ms = totalTime;

    let status = 'needs_review';
    let processingError = null;
    
    if (parsedData.confidence < 60) {
      processingError = 'Low confidence - please review carefully';
    }

    await base44.entities.Receipt.update(receiptId, {
      status,
      processing_finished_at: new Date().toISOString(),
      processing_error: processingError,
      processing_debug: JSON.stringify(debug),
      ocr_raw_text: ocrText,
      parsed_data: JSON.stringify(parsedData),
      merchant_name: parsedData.merchantName,
      total_amount_original: parsedData.total,
      currency_original: parsedData.currency,
      date: parsedData.date,
      category: category,
      subCategory: subCategory
    });

    debug.steps.push('success');

    return Response.json({
      success: true,
      status,
      processingTime: totalTime,
      parsedData,
      debug
    });

  } catch (error) {
    // CRITICAL: Always update receipt to failed state
    const totalTime = Date.now() - startTime;
    debug.steps.push('error_handler');
    debug.timings.total_ms = totalTime;
    
    // Extract error details
    const errorInfo = {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    };
    
    if (error.response) {
      errorInfo.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: typeof error.response.data === 'string' 
          ? error.response.data.substring(0, 200)
          : error.response.data
      };
    }
    
    debug.errors.push(errorInfo);
    
    // Update receipt to failed state
    if (receiptId) {
      try {
        await base44.entities.Receipt.update(receiptId, {
          status: 'failed',
          processing_finished_at: new Date().toISOString(),
          processing_error: error.message || 'Processing failed',
          processing_debug: JSON.stringify(debug),
        });
      } catch (updateError) {
        // If update fails, record it
        debug.errors.push({
          updateError: updateError.message,
          note: 'Failed to mark receipt as failed - possible permission issue'
        });
      }
    }

    return Response.json({
      error: error.message || 'Processing failed',
      success: false,
      processingTime: totalTime,
      step: debug.steps[debug.steps.length - 1],
      debug
    }, { status: 500 });
  }
});

function suggestCategory(merchantName) {
  const m = merchantName.toLowerCase();

  // Groceries
  if (/carrefour|lulu|monoprix|spinneys|grocery|market|supermarket|walmart|safeway/i.test(m)) {
    return { category: 'Home Expenses', subCategory: 'Groceries' };
  }

  // Apple Store
  if (/apple\s+store|apple\.com|apple\s+grafton/i.test(m)) {
    return { category: 'Shopping', subCategory: null };
  }

  // Utilities
  if (/kahramaa|electric/i.test(m)) return { category: 'Home Expenses', subCategory: 'Electricity' };
  if (/ooredoo|vodafone|wifi|internet/i.test(m)) return { category: 'Home Expenses', subCategory: 'Wi-Fi' };
  if (/\bwater\b/i.test(m)) return { category: 'Home Expenses', subCategory: 'Water' };
  if (/\bgas\b/i.test(m)) return { category: 'Home Expenses', subCategory: 'Gas' };

  // Food
  if (/restaurant|cafe|coffee|mcdonald|kfc|pizza|burger|starbucks|subway/i.test(m)) {
    return { category: 'Food', subCategory: null };
  }

  // Transport
  if (/uber|careem|taxi|petrol|fuel|shell|gas\s+station/i.test(m)) {
    return { category: 'Transport', subCategory: null };
  }

  // Shopping
  if (/mall|store|shop|amazon|noon|clothing|fashion/i.test(m)) {
    return { category: 'Shopping', subCategory: null };
  }

  // Health
  if (/pharmacy|hospital|clinic|medical|doctor|health|cvs|walgreens/i.test(m)) {
    return { category: 'Health', subCategory: null };
  }

  return { category: 'Other (Expense)', subCategory: null };
}