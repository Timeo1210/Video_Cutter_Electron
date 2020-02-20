import scipy.io.wavfile as wavf
import subprocess
import os
import sys
from datetime import datetime



def main(socket, video_name, video_dir):
    def ConvertVideoToAudio():
        command = "{} -i {} -ab 160k -ac 2 -ar 44100 -vn {} -hide_banner -loglevel panic -y".format(FFMPEG_PATH, video_path, audio_name)
        subprocess.call(command)  
    def CalcAudioChunks(data):
        toReturn = []
        for i in range(len(data) - 1, 0, -CHUNKSCUTTER):
            total = 0
            for j in range(i, i - CHUNKSCUTTER, -1):
                total += (abs(data[j, 0]) + abs(data[j, 1])) / 2
            toReturn.insert(0, {
            "chunkValue": total/CHUNKSCUTTER,
            "index": i
        })
        return toReturn;
    def CalcTreshold(AudioChunks):
        total = 0
        for Chunk in AudioChunks:
            total += Chunk["chunkValue"]
        total = total / len(AudioChunks)
        return total;
    def CalcProcessChunks(AudioChunks, treshold):
        ChunksInWait = []
        NoAudioTime = 0
        cutsInWait = []
        cuts = []

        for i in range(0, len(AudioChunks) - 1, 1):
            ChunksInWait.append(AudioChunks[i]["index"])

            if AudioChunks[i]["chunkValue"] <= treshold:
                NoAudioTime += 1 #4410 * 3 == 3 seconde de blanc          samplerate * n == n seconde de blanc     NoAudioTime === 100 alors 1 seconde de blanc

            if AudioChunks[i]["chunkValue"] > treshold: #20 
                ChunksInWait = []
                NoAudioTime = 0
                if len(cutsInWait) != 0:
                    cuts.append([cutsInWait[0] / samplerate, cutsInWait[len(cutsInWait) - 1] / samplerate])
                cutsInWait = []
            
            if NoAudioTime > 150: #1.5 seconde
                #cuts += [ChunksInWait[0] / samplerate, ChunksInWait[len(ChunksInWait) - 1] / samplerate]
                cutsInWait += ChunksInWait
                ChunksInWait = []
                NoAudioTime = 0
        return cuts;
    def CalcProcessAudio(ProcessChunks):
        toReturn = []
        for i in range(0, len(ProcessChunks) - 1, 1):
            for j in range(ProcessChunks[i], ProcessChunks[i] + CHUNKSCUTTER, 1):
                toReturn.append(data[j])
        return toReturn; 
    def CalcTimeStamp(ProcessChunks):
        ProcessTimeStamp = ProcessChunks
        for i in range(0, len(ProcessTimeStamp) - 1, 1):
            cutTime = ProcessTimeStamp[i][1] - ProcessTimeStamp[i][0]
            for j in range(i + 1, len(ProcessTimeStamp), 1):
                ProcessTimeStamp[j][0] = ProcessTimeStamp[j][0] - cutTime
                ProcessTimeStamp[j][1] = ProcessTimeStamp[j][1] - cutTime
        print(ProcessTimeStamp)
        return ProcessTimeStamp
    def CutVideoAt(start_time, end_time):
        if start_time == 0:
            start_time += 0.01

        cut1_file_name = os.path.join(PATH, video_title + "__cut1.mp4")
        cut2_file_name = os.path.join(PATH, video_title + "__cut2.mp4")
        cuts_file_name = os.path.join(PATH, video_title + "__cuts.txt")


        cmd1 = "ffmpeg -to {} -i {} {} -c:a copy -y -hide_banner -loglevel panic".format(start_time, video_path, cut1_file_name)
        subprocess.call(cmd1)

        cmd2 = "ffmpeg -ss {} -to {} -i {} {} -c:a copy -y -hide_banner -loglevel panic".format(end_time, length, video_path, cut2_file_name)
        subprocess.call(cmd2)

        cuts_file = open(cuts_file_name, "a")
        cuts_file.writelines([
            "file '{}'".format(cut1_file_name),
            "\n"
            "file '{}'".format(cut2_file_name)
        ])
        cuts_file.close()

        cmdFinal = "ffmpeg -f concat -safe 0 -i {} -c copy {} -y -hide_banner -loglevel panic".format(cuts_file_name, video_path)
        subprocess.call(cmdFinal)

        os.remove('{}'.format(cut1_file_name))
        os.remove('{}'.format(cut2_file_name))
        os.remove('{}'.format(cuts_file_name))

    video_name = video_name
    video_extension = video_name.split('.')[1]
    video_title = video_name.split('.')[0]
    FFMPEG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "Frameworks", "ffmpeg.exe")
    ABS_PATH = os.path.dirname(os.path.abspath(__file__))
    PATH = os.path.join(ABS_PATH, "Input_Videos", video_dir)
    video_path = os.path.join(PATH, video_name)
    file_id = video_dir
    audio_name = os.path.join(PATH, video_title + ".wav")
    output_video_path = os.path.join(ABS_PATH, "Output_Videos", video_dir, video_name)
    #print(ABS_PATH)
    #print(PATH)
    #print(output_video_path)

    socket.send_json({"progress": "Converting Video to Audio for analyse..."})
    ConvertVideoToAudio()

    treshold = 0
    samplerate, data = wavf.read(audio_name);
    length = data.shape[0] / samplerate
    CHUNKSCUTTER = int(samplerate / 100);

    print("length: " + str(length))
    print("samplerate: " + str(samplerate))

    AudioChunks = CalcAudioChunks(data)
    treshold = CalcTreshold(AudioChunks)

    print("treshold: " + str(treshold))
    print("ChunksCount: " + str(len(AudioChunks)))

    socket.send_json({"progress": "Analyse Audio..."})
    ProcessChunks = CalcProcessChunks(AudioChunks, treshold);
    TimeStamps = CalcTimeStamp(ProcessChunks)
    socket.send_json({"progress": "Cutting Video..."})
    cut_number = 0
    for TimeStamp in TimeStamps:
        cut_number += 1
        socket.send_json({"progress": "Cut {}/{}".format(cut_number, len(TimeStamps))})
        CutVideoAt(TimeStamp[0], TimeStamp[1]);
    os.replace(video_path, output_video_path);
    os.remove(audio_name)
    os.rmdir(PATH)
    return "FINISH"

def test(var1, var2):
    return var1 + var2

if __name__ == "__main__":
    main("new.mp4", "18-02-2020_11-18-36");
    #print("----")
    #print(os.path.dirname(os.path.abspath(__file__)))
    #print(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "Executable", "ffmpeg.exe"))