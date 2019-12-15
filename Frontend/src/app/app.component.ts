import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  AfterViewInit
} from "@angular/core";
import { WebSocketSubject } from "rxjs/webSocket";

/**
 * The messages exchanged between participants
 */
export class Message {
  constructor(
    public sender: string,
    public content: string,
    public isBroadcast = false
  ) {}
}

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements AfterViewInit {
  @ViewChild("viewer", { static: false }) private viewer: ElementRef;

  public connection_webcam: WebSocket;

  /**
   * An array of all messages
   */
  public serverMessages = new Array<Message>();

  /**
   * The message currently written in the text box
   */
  public clientMessage = "";

  /**
   * The current state of the broadcast button
   */
  public isBroadcast = false;

  /**
   * The name of the user chosen on top of the application
   */
  public sender = "";

  /**
   * An RxJs Subject of the WebSocket
   */
  private socket$: WebSocketSubject<Message>;

  constructor() {
    // Establish a new WebSocketSubject which connects to the server
    this.socket$ = new WebSocketSubject("ws://localhost:8999");

    // Subscribe to the subject
    this.socket$.subscribe(
      // When a new message is received display it and scroll down
      message => this.serverMessages.push(message) && this.scroll(),

      // Log errors
      err => console.error(err),

      // Log the end of the stream
      () => console.warn("Completed!")
    );
  }

  ngAfterViewInit(): void {
    this.scroll();
  }

  /**
   * Inverts the broadcast flag
   */
  public toggleIsBroadcast(): void {
    this.isBroadcast = !this.isBroadcast;
  }

  /**
   * Transmits messages to the server
   */
  public send(): void {
    // Disallow empty messages
    if (this.clientMessage.length === 0) {
      return;
    }

    // Make a new Message object
    const message = new Message(
      this.sender,
      this.clientMessage,
      this.isBroadcast
    );

    // // Append this message to the messages array
    // this.serverMessages.push(message);

    // Push the message to the server
    this.socket$.next(message);

    // Reset the message field
    this.clientMessage = "";

    // Scroll to the bottom of the message list
    this.scroll();
  }

  /**
   * Determines if any given message was written by the user themselves
   *
   * @param message The message to be analyzed
   */
  public isMine(message: Message): boolean {
    return message && message.sender === this.sender;
  }

  /**
   * Extracts the initials of a sender
   *
   * @param sender The sender of the message
   */
  public getSenderInitials(sender: string): string {
    return sender && sender.substring(0, 2).toLocaleUpperCase();
  }

  public getSenderColor(sender: string): string {
    const alpha = "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZ";
    const initials = this.getSenderInitials(sender);
    const value = Math.ceil(
      ((alpha.indexOf(initials[0]) + alpha.indexOf(initials[1])) *
        255 *
        255 *
        255) /
        70
    );
    return "#" + value.toString(16).padEnd(6, "0");
  }

  private scroll(): void {
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  }

  private getDiff(): number {
    if (!this.viewer) {
      return -1;
    }

    const nativeElement = this.viewer.nativeElement;
    return (
      nativeElement.scrollHeight -
      (nativeElement.scrollTop + nativeElement.clientHeight)
    );
  }

  private scrollToBottom(t = 1, b = 0): void {
    if (b < 1) {
      b = this.getDiff();
    }
    if (b > 0 && t <= 120) {
      setTimeout(() => {
        const diff = this.easeInOutSin(t / 120) * this.getDiff();
        this.viewer.nativeElement.scrollTop += diff;
        this.scrollToBottom(++t, b);
      }, 1 / 60);
    }
  }

  /**
   * Calculate timings for animations
   */
  private easeInOutSin(t): number {
    return (1 + Math.sin(Math.PI * t - Math.PI / 2)) / 2;
  }

  public onEnableCam(): void {
    this.connection_webcam = new WebSocket("ws://localhost:8765");

    // Display images from the server
    this.connection_webcam.onmessage = e => {
      document.getElementById("theImageGoesHere").src =
        "data:image/jpeg;base64," + e.data.toString();
    };
  }
}

/*

Author notice:

This program (at least the Frontend) was originally developed by Jonny Fox
https://medium.com/factory-mind/angular-websocket-node-31f421c753ff

*/
