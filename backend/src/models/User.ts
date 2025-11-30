import { Table, Column, Model, DataType, HasMany, BelongsToMany } from 'sequelize-typescript';
import { Follower } from './Follower';
import { Vacation } from './Vacation';

export enum UserRole {
  User = 'User',
  Admin = 'Admin'
}

@Table({
  tableName: 'users',
  timestamps: false
})
export class User extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
    field: 'user_id'
  })
  userId!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    field: 'first_name'
  })
  firstName!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    field: 'last_name'
  })
  lastName!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true
  })
  email!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  password!: string;

  @Column({
    type: DataType.ENUM('User', 'Admin'),
    allowNull: false,
    defaultValue: 'User'
  })
  role!: UserRole;

  @Column({
    type: DataType.DATE,
    field: 'created_at'
  })
  createdAt!: Date;

  @HasMany(() => Follower)
  followers!: Follower[];

  @BelongsToMany(() => Vacation, () => Follower)
  vacations!: Vacation[];
}
