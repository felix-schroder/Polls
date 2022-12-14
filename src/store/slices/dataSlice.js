import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

// api
import {_getQuestions, _getUsers, _saveQuestion, _saveQuestionAnswer} from "src/api/mockDataApi"

const INITIAL_STATE = {
    users: {},
    questions: {},
    fetching: false,
    submittingAnswer: false,
    submittingQuestion: false,
}

/**
 * Thunks
 */

export const fetchData = createAsyncThunk(
    "data/fetchData", // action type string
    async thunkAPI => { // callback ( = payload creator )
        return await Promise.all([_getUsers(), _getQuestions()])
    }
)

export const submitAnswer = createAsyncThunk(
    "data/submitAnswer",
    async ({ authedUserId, questionId, answer }, thunkAPI) => {
        await _saveQuestionAnswer({ authedUser: authedUserId, qid: questionId, answer })
        return { authedUserId, questionId, answer }
    }
)

export const saveQuestion = createAsyncThunk(
    "data/saveQuestion",
    async ({ optionOneText, optionTwoText, author, navigationCallback }, thunkAPI) => {
        return {
            question: await _saveQuestion({ optionOneText, optionTwoText, author }),
            navigationCallback
        }
    }
)

/**
 * Helpers
 */
const newStateFromSubmittedAnswer = (state, authedUserId, questionId, answer) => {
    const users = {
        ...state.users,
        [authedUserId]: {
            ...state.users[authedUserId],
            answers: {
                ...state.users[authedUserId].answers,
                [questionId]: answer
            }
        }
    }
    const questions = {
        ...state.questions,
        [questionId]: {
            ...state.questions[questionId],
            [answer]: {
                ...state.questions[questionId][answer],
                votes: state.questions[questionId][answer].votes.concat([authedUserId])
            }
        }
    }
    return { users, questions }
}

const newStateFromSubmittedQuestion = (state, question) => {
    const users = {
        ...state.users,
        [question.author]: {
            ...state.users[question.author],
            questions: state.users[question.author].questions.concat([question.id])
        }
    }

    const questions = {
        ...state.questions,
        [question.id]: question
    }

    return { users, questions }
}

export const dataSlice = createSlice({
    name: "data",
    initialState: INITIAL_STATE,
    reducers: {},
    extraReducers: {
        [fetchData.pending]: state => {
            return { ...state, fetching: true }
        },
        [fetchData.fulfilled]: (state, { payload }) => {
            return { ...state, users: payload[0], questions: payload[1], fetching: false }
        },
        [fetchData.rejected]: state => {
            console.error("An error occured during data fetching!")
            return { ...state, fetching: false }
        },
        [submitAnswer.pending]: state => {
            return { ...state, submittingAnswer: true }
        },
        [submitAnswer.fulfilled]: (state, { payload }) => {
            return {
                ...state,
                ...newStateFromSubmittedAnswer(state, payload.authedUserId, payload.questionId, payload.answer),
                submittingAnswer: false
            }
        },
        [submitAnswer.rejected]: state => {
            console.error("An error occured during submitting the answer!")
            return { ...state, submittingAnswer: false }
        },
        [saveQuestion.pending]: state => {
            return { ...state, submittingQuestion: true }
        },
        [saveQuestion.fulfilled]: (state, { payload }) => {
            payload.navigationCallback()
            return {
                ...state,
                ...newStateFromSubmittedQuestion(state, payload.question),
                submittingQuestion: false
            }
        },
        [saveQuestion.rejected]: state => {
            console.error("An error occured during submitting the question!")
            return { ...state, submittingQuestion: false }
        }
    }
})

/*export const {
} = dataSlice.actions*/

export default dataSlice.reducer