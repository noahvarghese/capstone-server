import { AttributeFactory } from "@models/abstract/base_model";
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

export interface QuizQuestionTypeAttributes {
    question_type: "multiple choice" | "single choice";
    html_tag: string;
    // Actually JSON string, needs to be parsed to use
    html_attributes: string;
}

export const EmptyQuizQuestionTypeAttributes =
    (): QuizQuestionTypeAttributes => ({
        question_type: "multiple choice",
        html_tag: "",
        html_attributes: "",
    });

@Entity({ name: "quiz_question_type" })
export default class QuizQuestionType implements QuizQuestionTypeAttributes {
    @PrimaryGeneratedColumn()
    public id!: number;
    @Column()
    public question_type!: "multiple choice";
    @Column()
    public html_tag!: string;
    @Column()
    public html_attributes!: string;

    public constructor(options?: Partial<QuizQuestionTypeAttributes>) {
        Object.assign(
            this,
            AttributeFactory(options, EmptyQuizQuestionTypeAttributes)
        );
    }
}
