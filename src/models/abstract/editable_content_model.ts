import { Column } from "typeorm";
import BaseModel from "./base_model";

export default abstract class EditableContentModel extends BaseModel {
    @Column()
    public updated_by_user_id!: number;
}
