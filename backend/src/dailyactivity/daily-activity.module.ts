import {Module} from '@nestjs/common';
import { DailyActivityCiController } from './daily-activity-ci.controller';
import { DailyActivityControllerWi } from './daily-activity-wi.controller';
import { DailyActivityCiService } from './daily-activity-ci.service';
import { DailyActivityServiceWi } from './daily-activity-wi.service';
import { CustomerDeliveryService } from './customer-delivery.service';
import { CustomerDeliveryController } from './customer-delivery.controller';
import { DataVerificationController } from './data-verification.controller';
import { VerificationController } from './verification.controller';
import { DataVerificationService } from './data-verification.service';
import { VerificationService } from './verification.service';


@Module({
    imports: [],
    controllers: [DailyActivityCiController, DailyActivityControllerWi, CustomerDeliveryController,
        DataVerificationController, VerificationController
    ],
    providers: [DailyActivityCiService, DailyActivityServiceWi, CustomerDeliveryService,
        DataVerificationService, VerificationService
    ],
    exports: [],
})export class DailyActivityModule {}