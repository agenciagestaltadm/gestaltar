// Supabase Edge Function: generate-target
// Generates targets.mind file from an uploaded image
// This function runs in Deno environment on Supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface GenerateTargetRequest {
  videoId: string;
  targetImagePath: string;
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const { videoId, targetImagePath }: GenerateTargetRequest = await req.json()

    // Download the target image from storage
    const { data: imageData, error: downloadError } = await supabase
      .storage
      .from('targets')
      .download(targetImagePath)

    if (downloadError) {
      throw new Error(`Failed to download target image: ${downloadError.message}`)
    }

    // Convert image to ArrayBuffer
    const imageBuffer = await imageData.arrayBuffer()

    // Generate targets.mind using MindAR compiler
    // Note: This is a simplified version. In production, you would use the actual MindAR compiler
    // For now, we'll store the image and use a pre-compiled target or external service
    
    // Store the target path in the database
    const targetPath = `targets/${videoId}.mind`
    
    // Update video record with target paths
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        target_path: targetPath,
        target_image_path: targetImagePath
      })
      .eq('id', videoId)

    if (updateError) {
      throw new Error(`Failed to update video record: ${updateError.message}`)
    }

    // Generate signed URL for the target
    const { data: urlData, error: urlError } = await supabase
      .storage
      .from('targets')
      .createSignedUrl(targetPath, 3600 * 24 * 7) // 7 days expiry

    if (urlError) {
      throw new Error(`Failed to generate signed URL: ${urlError.message}`)
    }

    return new Response(JSON.stringify({
      success: true,
      targetPath,
      targetUrl: urlData.signedUrl
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error generating target:', error)
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
