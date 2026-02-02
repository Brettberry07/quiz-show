import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  refreshTokenHash: string;
}
