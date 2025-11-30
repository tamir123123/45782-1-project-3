import { Table, Column, Model, DataType, HasMany, BelongsToMany } from 'sequelize-typescript';
import { Follower } from './Follower';
import { User } from './User';

@Table({
  tableName: 'vacations',
  timestamps: false
})
export class Vacation extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
    field: 'vacation_id'
  })
  vacationId!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  destination!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  description!: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    field: 'start_date'
  })
  startDate!: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    field: 'end_date'
  })
  endDate!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false
  })
  price!: number;

  @Column({
    type: DataType.STRING(255),
    field: 'image_file_name'
  })
  imageFileName!: string;

  @Column({
    type: DataType.DATE,
    field: 'created_at'
  })
  createdAt!: Date;

  @Column({
    type: DataType.DATE,
    field: 'updated_at'
  })
  updatedAt!: Date;

  @HasMany(() => Follower)
  followers!: Follower[];

  @BelongsToMany(() => User, () => Follower)
  users!: User[];
}
