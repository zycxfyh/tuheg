import { Module } from '@nestjs/common';
import { ContentCreationService } from './content-creation.service';
import { EducationService } from './education.service';
import { HealthcareService } from './healthcare.service';
import { BusinessService } from './business.service';
import { ManufacturingService } from './manufacturing.service';
import { IndustryController } from './industry.controller';

@Module({
  providers: [
    ContentCreationService,
    EducationService,
    HealthcareService,
    BusinessService,
    ManufacturingService,
  ],
  controllers: [IndustryController],
  exports: [
    ContentCreationService,
    EducationService,
    HealthcareService,
    BusinessService,
    ManufacturingService,
  ],
})
export class IndustryModule {}
