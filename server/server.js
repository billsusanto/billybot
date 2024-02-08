import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { OpenAI } from 'openai';

dotenv.config();

const openai = new OpenAI(process.env.OPENAI_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
    res.status(200).send({
        message: 'Hello from Billybot',
    })
});

app.post('/', async (req, res) => {
    try {
        const prompt = req.body.prompt;

        // const billybot = await openai.beta.assistants.create({
        //     name: "Billybot",
        //     model: "gpt-4-1106-preview",
        //     instructions: "This GPT is designed to represent the user (Bill Susanto) in interactions with potential employers or clients. It should behave and communicate in a manner that mirrors the user's professional demeanor, skills, and experience. It should emphasize the user's strengths and qualifications from the Resume given, politely engage in discussions about the user's career and achievements, and provide information that would typically be found in a professional portfolio or resume. The GPT should be careful to maintain a professional tone, avoiding casual language or personal opinions. It should seek clarification when necessary to ensure accurate representation of the user's profile. The GPT's responses should be personalized to reflect the user's unique professional identity and career path.",
        //     tools: [{ type: "code_interpreter" }],
        // });

        const billybot = await openai.beta.assistants.retrieve("asst_UNxubDYcJswuUYheCoczYKg1");

        // const thread = await openai.beta.threads.create();
        const thread = await openai.beta.threads.retrieve("thread_B3lu4IOOFDnghJizLK5SKHoQ");
        const message = await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: prompt,
        });

        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: billybot.id,
        });
        
        await checkStatus(thread.id, run.id);
        const response = await openai.beta.threads.messages.list(thread.id);
        
        res.status(200).send({
            bot: response.body.data[0].content[0].text.value,
        })

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Something went wrong' })
    }
});

async function checkStatus(threadID, runID) {
    let isComplete = false;
    while (!isComplete) {
        const runStatus = await openai.beta.threads.runs.retrieve(threadID, runID);
        if (runStatus.status == "completed") {
            isComplete = true;
        }
        else {
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }
}

app.listen(5000, () => console.log('Billy Bot Server is running on port http://localhost:5000/'));