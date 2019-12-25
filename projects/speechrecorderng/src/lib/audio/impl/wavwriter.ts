import { WavFileFormat } from './wavformat'
import { PCMAudioFormat } from '../format'
import { BinaryByteWriter } from '../../io/BinaryWriter'


   export class WavWriter {

     static PCM:number = 1;
     static DEFAULT_SAMPLE_SIZE_BYTES:number = 2;
     private bw:BinaryByteWriter;
     private format:PCMAudioFormat;
     private dataLength:number;

     constructor() {
       this.bw = new BinaryByteWriter();
     }

     writeFmtChunk(audioBuffer:AudioBuffer){

       this.bw.writeUint16(WavFileFormat.PCM,true);
       let frameSize=WavWriter.DEFAULT_SAMPLE_SIZE_BYTES*audioBuffer.numberOfChannels; // fixed 16-bit for now
       this.bw.writeUint16(audioBuffer.numberOfChannels,true);
       this.bw.writeUint32(audioBuffer.sampleRate,true);
         // dwAvgBytesPerSec
       this.bw.writeUint32(frameSize*audioBuffer.sampleRate,true);
       this.bw.writeUint16(frameSize,true);
       // sample size in bits (PCM format only)
       this.bw.writeUint16(WavWriter.DEFAULT_SAMPLE_SIZE_BYTES*8,true);
     }

     writeDataChunk(audioBuffer:AudioBuffer){

       let chData0=audioBuffer.getChannelData(0);
       let dataLen=chData0.length;
        let hDynIntRange=1 << ((WavWriter.DEFAULT_SAMPLE_SIZE_BYTES*8)-1);
       for(let s=0;s<dataLen;s++) {
         // interleaved channel data
         for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
           let chData = audioBuffer.getChannelData(ch);
           let valFlt=chData[s];
           let valInt=Math.round(valFlt*hDynIntRange);
           this.bw.writeInt16(valInt,true);
         }
       }

     }

     writeChunkHeader(name:string,chkLen:number){
       this.bw.writeAscii(name);
       this.bw.writeUint32(chkLen,true);
     }

     writeAsync(audioBuffer:AudioBuffer,callback: (wavFileData:Uint8Array)=> any){

       let dataChkByteLen=this.writeHeader(audioBuffer);

         let wo = new Worker('./wavwriter.worker',{type: 'module'});

       let chs = audioBuffer.numberOfChannels;

       let frameLength = audioBuffer.getChannelData(0).length;
       let ad = new Float32Array(chs * frameLength);
       for (let ch = 0; ch < chs; ch++) {
         ad.set(audioBuffer.getChannelData(ch), ch * frameLength);
       }
         // ensureCapacity blocks !!!
       this.bw.ensureCapacity(dataChkByteLen);
       wo.onmessage = (me) => {
         callback(me.data.buf);
       }
       //TODO Fixed sample size of 16 bits
       wo.postMessage({sampleSizeInBits:16, chs: chs, frameLength: frameLength, audioData: ad,buf:this.bw.buf,bufPos:this.bw.pos}, [ad.buffer,this.bw.buf]);
     }

     write(audioBuffer:AudioBuffer):Uint8Array{
       this.writeHeader(audioBuffer);
       this.writeDataChunk(audioBuffer);
       return this.bw.finish();
     }


      writeHeader(audioBuffer:AudioBuffer):number{

        this.bw.writeAscii(WavFileFormat.RIFF_KEY);
        let dataChkByteLen=audioBuffer.getChannelData(0).length*WavWriter.DEFAULT_SAMPLE_SIZE_BYTES*audioBuffer.numberOfChannels;
        let wavChunkByteLen=(4+4)*3+16+dataChkByteLen;
        let wavFileDataByteLen=wavChunkByteLen+8;

        this.bw.writeUint32(wavChunkByteLen,true); // must be set to file length-8 later
        this.bw.writeAscii(WavFileFormat.WAV_KEY);
        this.writeChunkHeader('fmt ',16);
        this.writeFmtChunk(audioBuffer);
        this.writeChunkHeader('data',dataChkByteLen);
        return dataChkByteLen;
      }

   }



