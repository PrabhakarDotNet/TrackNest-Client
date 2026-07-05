import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {

  private clientId = environment.googleClientId;

  private waitForGoogle(timeoutMs = 10000): Promise<any> {
    return new Promise((resolve, reject) => {
      const existing = (window as any).google;

      if (existing?.accounts?.id) {
        resolve(existing);
        return;
      }

      const start = Date.now();

      const interval = setInterval(() => {
        const google = (window as any).google;

        if (google?.accounts?.id) {
          clearInterval(interval);
          resolve(google);
          return;
        }

        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          reject(new Error('Google Identity Services script failed to load in time.'));
        }
      }, 50);
    });
  }

 async initialize(callback: (response: any) => void): Promise<void> {
  const google = await this.waitForGoogle();

  google.accounts.id.initialize({
    client_id: this.clientId,
    callback,
    auto_select: false,
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt: false,
    itp_support: false
  });
}

  async renderButton(element: HTMLElement): Promise<void> {
    const google = await this.waitForGoogle();

    google.accounts.id.renderButton(element, {
      theme: 'outline',
      size: 'large',
      width: 250
    });
  }

  async prompt(): Promise<void> {
    const google = await this.waitForGoogle();
    google.accounts.id.prompt();
  }
}