import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, AbstractControl, ValidatorFn, Validators } from '@angular/forms';
import { DOCUMENT } from '@angular/common';

import { NgRedux } from '@angular-redux/store';
import { PageScrollService } from 'ngx-page-scroll-core';

import { AppAction, IAppState } from '../../store/interfaces/IAppState';
import { useDefault } from '../../common/common';
import { ModifyReservationDelegate } from '../../api/delegates/modify-reservation.delegate';
import { SiteURLUtils } from '../../common/site.url.utils';
import { IMessage } from '../../api/interfaces/Messages/IMessage';
import { ActionHandler } from '../../store/action.handler';
import { IAppConfig } from '../../store/interfaces/IAppConfig';
import { APP_CONFIG } from '../../api/config/index';
import { Hotel, Reservation, ReservationErrorMessageKeys, Guest } from '../../api/model/index';
import { MessagesUtil } from '../../common/messages.util';
import { VALID_NAME_FORM_REGEX } from '../../common/form-validator.util';
import { Brand } from 'ihg-brand-common-app-brand-constants';

const NUMBER_OF_MAIN_GUESTS = 1;
const TOP_ID = '#addGuestsTop';
@Component({
  selector: 'add-guests',
  templateUrl: './add-guests.component.html',
  styleUrls: ['./add-guests.component.scss']
})
export class AddGuestsComponent implements OnInit {
  @Input() messages;
  @Input() isOpen: boolean;
  state: IAppState;
  private _appConfig: IAppConfig;
  reservation: Reservation;
  hotel: Hotel;
  numberOfExistingAdditionalGuests: number;
  numberOfAdditionalGuestsAvailableToAdd: number;
  message: IMessage;
  displayForm: boolean;
  hasSuccessfulGuestAdded: boolean;
  onlyMainGuest: boolean;
  allAdditionalGuestsAlreadyEntered: boolean;
  someAdditionalGuestsAlreadyEntered: boolean;
  possibleAdditionalGuests: number;
  hotelDetailsURL: string;
  additionalGuestsForm: FormGroup;
  guestsFormArray: FormArray;
  termsAndConditionsURL: string;
  customerCareWorldWideURL: string;
  isMRMS: boolean;

  constructor(@Inject(APP_CONFIG) appConfig: IAppConfig,
    private _ngRedux: NgRedux<IAppState>,
    private _modifyReservationDelegate: ModifyReservationDelegate,
    private pageScrollService: PageScrollService,
    @Inject(DOCUMENT) private document) {
    this._appConfig = appConfig;
  }

  ngOnInit() {
    this.numberOfExistingAdditionalGuests = 0;
    this.numberOfAdditionalGuestsAvailableToAdd = 0;
    this.message = null;
    this.displayForm = false;
    this.hasSuccessfulGuestAdded = false;
    this.onlyMainGuest = false;
    this.allAdditionalGuestsAlreadyEntered = false;
    this.someAdditionalGuestsAlreadyEntered = false;
    this.possibleAdditionalGuests = 0;
    this.hotelDetailsURL = '#';
    this.updateFromState();
    this._ngRedux.subscribe(() => {
      this.updateFromState();
    });
  }

  updateFromState() {
    this.state = this._ngRedux.getState();
    this.reservation = useDefault(this.state.reservation, new Reservation());
    this.hotel = useDefault(this.state.hotel, new Hotel());

    this.isMRMS = (this.hotel.brandCode.toLowerCase() == Brand.MRMS.fourLetterBrandCode.toLowerCase()) ? true : false;

    this.displayForm = !(this.reservation.rate.hasAdditionalGuestRestriction() && this.hotel.isInGreaterChina());
    this._updateAdditionalGuestsStatus(this.reservation.stay.numberOfAdults, this.reservation.additionalGuests.length);
    this.termsAndConditionsURL = SiteURLUtils.getLocalizedTermsConditionsUrl(this._appConfig);
    this.customerCareWorldWideURL = SiteURLUtils.getLocalizedCustomerCareUrl(this._appConfig);
    ActionHandler.handleSuccess(this.state, AppAction.ADD_ADDITIONAL_GUEST_NAMES, () => {
      this.hotelDetailsURL = SiteURLUtils.getLocalizedHotelDetailsUrl(this._appConfig, this.hotel.mnemonic, this.hotel.seoCity);
      this.hasSuccessfulGuestAdded = true;
      this.message = MessagesUtil.toSuccessMessage(ReservationErrorMessageKeys.SUCCESS_ADD_GUESTS);
      this.goToTop();
    });
    ActionHandler.handleError(this.state, AppAction.ADD_ADDITIONAL_GUEST_NAMES, () => {
      this.message = MessagesUtil.fromError(this._appConfig, this.state.error, ReservationErrorMessageKeys.ADD_GUESTS_ERROR_UNKNOWN_KEY);
    });
  }
  saveAdditionalGuestsNames() {
    this.message = null;
    this.hasSuccessfulGuestAdded = false;
    const additionalGuests: Array<Guest> = new Array<Guest>();

    for (const guest of this.guestsFormArray.controls) {
      if (!guest.pristine) {
        additionalGuests.push(new Guest(guest.get('firstName').value, guest.get('lastName').value));
      }
    }
    this._modifyReservationDelegate.addAdditionalGuestNames(additionalGuests);
  }

  private _updateAdditionalGuestsStatus(numberOfAdults: number, existingAdditionalGuests: number) {
    this.onlyMainGuest = false;
    this.allAdditionalGuestsAlreadyEntered = false;
    this.someAdditionalGuestsAlreadyEntered = false;
    this.numberOfAdditionalGuestsAvailableToAdd = 0;
    this.numberOfExistingAdditionalGuests = existingAdditionalGuests;
    this.guestsFormArray = new FormArray([]);
    this.additionalGuestsForm = new FormGroup({
      guests: new FormArray([])
    });
    if (numberOfAdults === NUMBER_OF_MAIN_GUESTS) {
      this.onlyMainGuest = true;
      return;
    }
    this.possibleAdditionalGuests = numberOfAdults - NUMBER_OF_MAIN_GUESTS;
    if (this.numberOfExistingAdditionalGuests === this.possibleAdditionalGuests) {
      this.allAdditionalGuestsAlreadyEntered = true;
      return;
    }
    if (this.numberOfExistingAdditionalGuests > 0) {
      this.someAdditionalGuestsAlreadyEntered = true;
    }
    if (this.possibleAdditionalGuests > this.numberOfExistingAdditionalGuests) {
      this.numberOfAdditionalGuestsAvailableToAdd = this.possibleAdditionalGuests - this.numberOfExistingAdditionalGuests;
      this.guestsFormArray = this.additionalGuestsForm.get('guests') as FormArray;
      for (let i = 0; i < this.numberOfAdditionalGuestsAvailableToAdd; i++) {
        this.guestsFormArray.push(new FormGroup({
          firstName: new FormControl('', [Validators.pattern(VALID_NAME_FORM_REGEX)]),
          lastName: new FormControl('', [Validators.pattern(VALID_NAME_FORM_REGEX)])
        }, { validators: this.checkBothRequired() }));
      }
    }
  }

  checkBothRequired(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      let error = null;
      const firstName = control.get('firstName');
      const firstNameValue = useDefault(firstName.value, '').trim();
      const lastName = control.get('lastName');
      const lastNameValue = useDefault(lastName.value, '').trim();
      if ((!!firstNameValue && !lastNameValue) || (!!lastNameValue && !firstNameValue)) {
        if (!firstNameValue) {
          error = { firstNameRequired: true }
        }
        if (!lastNameValue) {
          error = { lastNameRequired: true }
        }
      }
      if (!firstNameValue && !lastNameValue) {
        control.markAsPristine();
        control.markAsUntouched()
      }
      return error;
    };
  }
  goToTop(): void {
    this.pageScrollService.scroll({document:this.document, scrollTarget:TOP_ID});
  };
}
