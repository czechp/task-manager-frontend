import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppUser } from 'src/app/models/AppUser';
import { Goal } from 'src/app/models/Goal';
import { SubTask } from 'src/app/models/SubTask';
import { Task } from 'src/app/models/Task';
import { HttpApiService } from 'src/app/services/httpApiService/http-api.service';
import { AuthorizationService } from 'src/app/services/security/authorizationService/authorization.service';
import { goalEndpoint, subtaskEndpoint, taskEndpoint, commentEndpoint } from 'src/app/services/URL';

@Component({
  selector: 'app-task-details-page',
  templateUrl: './task-details-page.component.html',
  styleUrls: ['./task-details-page.component.css']
})
export class TaskDetailsPageComponent implements OnInit {
  private taskId = 0;
  public statement = '';
  public isOwner = false;
  public task: Task = { appUsers: [], goals: [], subTasks: [] }

  constructor(
    private activeRoute: ActivatedRoute,
    private httpApiService: HttpApiService,
    public authorizationService: AuthorizationService
  ) {
    this.taskId = activeRoute.snapshot.params.id;
  }

  ngOnInit(): void {
    this.getTask();
  }

  // <---------------------- Public section ---------------------->

  public updateTask(): void {
    this.httpApiService.put(taskEndpoint + '/' + this.taskId, this.task, [])
      .subscribe(
        (next: any) => { this.task = next },
        (error: any) => { this.statement = this.httpApiService.errorStatementHandler(error.status) }
      )
  }

  public deleteUser(appUserId: number): void {
    this.httpApiService.delete(taskEndpoint + '/' + this.task.id + '/users/' + appUserId, [])
      .subscribe(
        (next: any) => { this.getTask() },
        (error: any) => { this.statement = this.httpApiService.errorStatementHandler(error.status) }
      );
  }

  public addAppUser(appUserId: number) {
    this.httpApiService.post(taskEndpoint + '/' + this.task.id + '/users/' + appUserId, {}, [])
      .subscribe(
        (next: any) => { this.task = next },
        (error: any) => { this.statement = this.httpApiService.errorStatementHandler(error.status) }
      );
  }

  public deleteGoal(goalId: number) {
    this.clearStatement();
    this.httpApiService.delete(goalEndpoint + '/' + goalId, [])
      .subscribe(
        (next: any) => { this.getTask(); },
        (error: any) => { this.statement = this.httpApiService.errorStatementHandler(error.status); }
      );
  }

  public modifyGoal(goal: Goal) {
    this.httpApiService.put(goalEndpoint + '/' + goal.id, goal, [])
      .subscribe(
        (next: any) => { this.getTask(); },
        (error: any) => { this.statement = this.httpApiService.errorStatementHandler(error.status); }
      );
  }

  public modifySubtask(subtask: SubTask): void {
    this.clearStatement();
    this.httpApiService.put(subtaskEndpoint + '/' + subtask.id, subtask, [])
      .subscribe(
        (next: any) => { this.getTask(); },
        (error: any) => { this.statement = this.httpApiService.errorStatementHandler(error.status) }
      );
  }

  public deleteSubtask(subtaskId: number): void {
    this.clearStatement();
    this.httpApiService.delete(subtaskEndpoint + '/' + subtaskId, [])
      .subscribe(
        (next: any) => { this.getTask(); },
        (error: any) => { }
      );
  }

  public addGoal(goal: Goal): void {
    this.clearStatement();
    this.httpApiService.post(taskEndpoint + '/' + this.task.id + '/goals', goal, [])
      .subscribe(
        (next: any) => { this.getTask(); },
        (error: any) => { this.statement = this.httpApiService.errorStatementHandler(error.status); }
      );
  }

  public addSubtask(subtask: SubTask): void {
    this.clearStatement();
    this.httpApiService.post(taskEndpoint + '/' + this.task.id + '/subtasks', subtask, [])
      .subscribe(
        (next: any) => { this.getTask(); },
        // tslint:disable-next-line: no-shadowed-variable
        (error: any) => { this.statement = this.httpApiService.errorStatementHandler(error.status); }
      );

  }

  public addComment(content: string) {
    this.clearStatement();
    this.httpApiService.post(taskEndpoint + '/' + this.task.id + '/comments', {}, [{ name: 'content', parameter: content }])
      .subscribe(
        (next: any) => { this.task = this.sortInTask(next); this.isOwner = this.areYouOwner(); },
        (error: any) => { this.statement = this.httpApiService.errorStatementHandler(error.status); }
      );
  }

  public removeComment(commentId: number): void {
    this.clearStatement();
    this.httpApiService.delete(commentEndpoint + '/' + commentId, [])
      .subscribe(
        (next: any) => { this.getTask(); },
        (error: any) => { this.statement = this.httpApiService.errorStatementHandler(error.status); }
      );
  }

  // <---------------------- Private section ---------------------->
  private getTask() {
    this.clearStatement();
    this.httpApiService.get(taskEndpoint + '/' + this.taskId, [])
      .subscribe(
        (next: any) => { this.task = this.sortInTask(next); this.isOwner = this.areYouOwner(); },
        (error: any) => { this.statement = this.httpApiService.errorStatementHandler(error.status); }
      );
  }

  private areYouOwner(): boolean {
    const isAmongParticipants = this.task.appUsers
      .map((x: AppUser) => x.username)
      .filter((x: string) => x === this.authorizationService.getUsername())
      .length > 0;

    const currentUserRole = this.authorizationService.getRole();

    const isAdminOrDirectorOrSuperUser = currentUserRole === 'ADMIN'
      || currentUserRole === 'SUPERUSER'
      || currentUserRole === 'DIRECTOR';

    return isAmongParticipants || isAdminOrDirectorOrSuperUser;
  }
  private clearStatement() { this.statement = ''; }

  private sortInTask(task: Task): Task {
    task.appUsers = this.sortById(task.appUsers);
    task.goals = this.sortById(task.goals);
    task.subTasks = this.sortById(task.subTasks);
    task.taskComments = this.sortById(task.taskComments);
    return task;
  }

  private sortById(objects: any[]): any[] {
    return objects.sort((x1: any, x2: any) => x1.id - x2.id);
  }
}
