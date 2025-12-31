export interface ApplicantRegistration {
  fullName: string;
  email: string;
  phoneNumber: string;
  previousSchool: string;
  currentSemester?: string;
  technicalMajor?: string;
  interestedMajors: string[]; // IDs of the selected careers
  marketingChannel: string;
}