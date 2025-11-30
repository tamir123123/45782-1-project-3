import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './User';
import { Vacation } from './Vacation';

@Table({
  tableName: 'followers',
  timestamps: false
})
export class Follower extends Model {
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    field: 'user_id'
  })
  userId!: string;

  @ForeignKey(() => Vacation)
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    field: 'vacation_id'
  })
  vacationId!: string;

  @Column({
    type: DataType.DATE,
    field: 'followed_at'
  })
  followedAt!: Date;

  @BelongsTo(() => User)
  user!: User;

  @BelongsTo(() => Vacation)
  vacation!: Vacation;
}
