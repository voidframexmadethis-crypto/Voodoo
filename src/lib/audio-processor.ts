import ffmpeg from 'fluent-ffmpeg';

/**
 * Loops a producer's voice tag every 30 seconds over the raw beat file
 * @param rawBeatPath Path to the untagged wav/mp3
 * @param voiceTagPath Path to the producer's voice tag audio
 * @param outputPath Path where the tagged preview should be saved
 */
export function applyAudioWatermark(rawBeatPath: string, voiceTagPath: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(rawBeatPath)
      .input(voiceTagPath)
      // FFmpeg filter: Loops the voice tag input and mixes it dynamically with the main beat
      // Note: size=2e9 is used as a large buffer for the loop
      .complexFilter([
        '[1:a]aloop=loop=-1:size=2e9[looped_tag]', 
        '[0:a][looped_tag]amix=inputs=2:duration=first:weights=1 0.4[out]'
      ])
      .map('[out]')
      .audioCodec('libmp3lame')
      .audioBitrate(192)
      .save(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => {
        console.error('FFmpeg Watermark Error:', err);
        reject(err);
      });
  });
}
