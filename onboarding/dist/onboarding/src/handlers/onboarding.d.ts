import { Env } from "../types";
export declare function handleOnboarding(
  request: Request,
  env: Env,
): Promise<Response>;
interface OnboardingQuestion {
  id: string;
  question: string;
  type: string;
  options?: string[];
}
export declare function generateOnboardingQuestions(
  industry: string,
  requirements?: string[],
): Promise<OnboardingQuestion[]>;
export {};
//# sourceMappingURL=onboarding.d.ts.map
