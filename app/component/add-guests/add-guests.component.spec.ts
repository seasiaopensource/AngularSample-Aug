import { waitForAsync } from '@angular/core/testing';
import {MockNgRedux} from '../../test/test.helpers';
import {Reservation} from '../../api/model/reservation/reservation.model';
import {AppAction, AppActionState, IAppState} from '../../store/interfaces/IAppState';
import {Stay} from '../../api/model/reservation/stay.model';
import {Guest} from '../../api/model/guest/guest.model';
import {AddGuestsComponent} from './add-guests.component';
import {IAppConfig} from '../../store/interfaces/IAppConfig';
import {HotelRegion} from '../../api/model/hotel/hotel-region.model';
import {Hotel} from '../../api/model/hotel/hotel.model';
import {AdditionalGuestRestriction} from "../../api/model/reservation/rate/additional-guest-restriction.model";
import { HotelBrandInfoComponent } from '../hotel-brand-info';
import { HotelReservationDetailsComponent } from '../hotel-reservation-details';

describe('AddGuestsComponent', () => {
  let component: AddGuestsComponent;
  let mockRedux;
  let mockAppConfig: IAppConfig;
  let mockModifyReservationService;
  let pageScrollServiceMock;
  let documentMock;

  beforeEach(waitForAsync(() => {
    mockAppConfig = <IAppConfig>{};
    mockAppConfig.brand = {
      'brandCode': '6c',
      'fourLetterBrandCode': '',
      'brandName': 'ihg',
      'consolidatedDomainPath': '',
      'domain': ''
    };
    mockAppConfig.country = 'us';
    mockAppConfig.language = 'en';
    mockRedux = new MockNgRedux();
    mockModifyReservationService = {
      addAdditionalGuestNames: () => {}
    };
    pageScrollServiceMock = {
      scroll: () => {},
    };
    documentMock = {};
    component = new AddGuestsComponent(mockAppConfig, mockRedux, mockModifyReservationService, pageScrollServiceMock, documentMock);
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should set reservation from state', () => {
    const hotel: Hotel = new Hotel();
    hotel.brandCode = 'test';
    const reservation: Reservation =  new Reservation();
    const mockState = <IAppState> {};
    mockState.reservation = reservation;
    mockState.hotel = hotel;
    spyOn(mockRedux, 'getState').and.returnValue(mockState);
    component.ngOnInit();
    expect(component.reservation).toBe(mockState.reservation);

  });
  it('should set some guests available to add when there are existing additional guest names in a reservation', () => {
    const hotel: Hotel = new Hotel();
    hotel.brandCode = 'test';
    const reservation: Reservation =  new Reservation();
    reservation.stay = new Stay();
    reservation.stay.numberOfAdults = 6;
    reservation.additionalGuests = new Array<Guest>(2);
    const mockState = <IAppState> {};
    mockState.reservation = reservation;
    mockState.hotel = hotel;
    spyOn(mockRedux, 'getState').and.returnValue(mockState);
    component.ngOnInit();
    expect(component.reservation).toBe(mockState.reservation);
    expect(component.onlyMainGuest).toBeFalsy();
    expect(component.someAdditionalGuestsAlreadyEntered).toBeTruthy();
    expect(component.allAdditionalGuestsAlreadyEntered).toBeFalsy();
    expect(component.numberOfExistingAdditionalGuests).toBe(2);
    expect(component.numberOfAdditionalGuestsAvailableToAdd).toBe(3);
    expect(component.guestsFormArray).toBeDefined();
    expect(component.guestsFormArray.length).toBe(3);
  });
  it('should set no guests available to add when only main guest in a reservation', () => {
    const hotel: Hotel = new Hotel();
    hotel.brandCode = 'test';
    const reservation: Reservation =  new Reservation();
    reservation.stay = new Stay();
    reservation.stay.numberOfAdults = 1;
    reservation.additionalGuests = new Array<Guest>();
    const mockState = <IAppState> {};
    mockState.reservation = reservation;
    mockState.hotel = hotel;
    spyOn(mockRedux, 'getState').and.returnValue(mockState);
    component.ngOnInit();
    expect(component.reservation).toBe(mockState.reservation);
    expect(component.onlyMainGuest).toBeTruthy();
    expect(component.someAdditionalGuestsAlreadyEntered).toBeFalsy();
    expect(component.allAdditionalGuestsAlreadyEntered).toBeFalsy();
    expect(component.numberOfExistingAdditionalGuests).toBe(0);
    expect(component.numberOfAdditionalGuestsAvailableToAdd).toBe(0);
    expect(component.guestsFormArray).toBeDefined();
    expect(component.guestsFormArray.length).toBe(0);
  });
  it('should set no guests available to add when all guest already entered in a reservation', () => {
    const hotel: Hotel = new Hotel();
    hotel.brandCode = 'test';
    const reservation: Reservation =  new Reservation();
    reservation.stay = new Stay();
    reservation.stay.numberOfAdults = 6;
    reservation.additionalGuests = new Array<Guest>(5);
    const mockState = <IAppState> {};
    mockState.reservation = reservation;
    mockState.hotel = hotel;
    spyOn(mockRedux, 'getState').and.returnValue(mockState);
    component.ngOnInit();
    expect(component.reservation).toBe(mockState.reservation);
    expect(component.onlyMainGuest).toBeFalsy();
    expect(component.someAdditionalGuestsAlreadyEntered).toBeFalsy();
    expect(component.allAdditionalGuestsAlreadyEntered).toBeTruthy();
    expect(component.numberOfExistingAdditionalGuests).toBe(5);
    expect(component.numberOfAdditionalGuestsAvailableToAdd).toBe(0);
    expect(component.guestsFormArray).toBeDefined();
    expect(component.guestsFormArray.length).toBe(0);
  });
  it('should set isSuccessGuestAdded flag to true when successful add guest names operation was completed', () => {
    const hotel: Hotel = new Hotel();
    hotel.brandCode = 'test';
    const reservation: Reservation =  new Reservation();
    reservation.stay = new Stay();
    reservation.stay.numberOfAdults = 6;
    reservation.additionalGuests = new Array<Guest>(5);
    const mockState = <IAppState> {};
    mockState.state = AppActionState.SUCCESS;
    mockState.actionType = AppAction.ADD_ADDITIONAL_GUEST_NAMES;
    mockState.reservation = reservation;
    mockState.hotel = hotel;
    spyOn(mockRedux, 'getState').and.returnValue(mockState);
    const scrollStart = spyOn(pageScrollServiceMock, 'scroll');
    component.ngOnInit();
    expect(component.reservation).toBe(mockState.reservation);
    expect(component.hasSuccessfulGuestAdded).toBeTruthy();
    expect(component.hotelDetailsURL).toBeDefined();
    expect(scrollStart).toHaveBeenCalled();
  });
  it('should set error message when failed add guest names operation was completed', () => {
    const hotel: Hotel = new Hotel();
    hotel.brandCode = 'test';
    const reservation: Reservation =  new Reservation();
    const mockState = <IAppState> {};
    mockState.state = AppActionState.ERROR;
    mockState.actionType = AppAction.ADD_ADDITIONAL_GUEST_NAMES;
    mockState.reservation = reservation;
    mockState.hotel = hotel;
    spyOn(mockRedux, 'getState').and.returnValue(mockState);
    const scrollStart = spyOn(pageScrollServiceMock, 'scroll');
    component.ngOnInit();
    expect(component.reservation).toBe(mockState.reservation);
    expect(component.message).toBeDefined();
    expect(component.message.key).toBe('addguests.error.message');
    expect(scrollStart).not.toHaveBeenCalled();
  });
  it('should create invalid FormControl with invalid pattern', () => {
    const hotel: Hotel = new Hotel();
    hotel.brandCode = 'test';
    const addAdditionalGuestNames = spyOn(mockModifyReservationService, 'addAdditionalGuestNames');
    const reservation: Reservation =  new Reservation();
    reservation.stay.numberOfAdults = 7;
    reservation.additionalGuests = new Array<Guest>();
    const mockState = <IAppState> {};
    mockState.reservation = reservation;
    mockState.hotel = hotel;
    spyOn(mockRedux, 'getState').and.returnValue(mockState);
    component.ngOnInit();
    expect(component.reservation).toBe(mockState.reservation);
    expect(component.onlyMainGuest).toBeFalsy();
    expect(component.numberOfAdditionalGuestsAvailableToAdd).toBe(6);
    expect(component.guestsFormArray).toBeDefined();
    expect(component.guestsFormArray.length).toBe(6);

    // Setting values to the form
    component.guestsFormArray.controls[0].get('firstName').setValue('First Name8');
    component.guestsFormArray.controls[0].get('lastName').setValue('Last Name');
    component.guestsFormArray.controls[1].get('firstName').setValue('First Name');
    component.guestsFormArray.controls[2].get('lastName').setValue('Last Name');
    component.guestsFormArray.controls[3].get('firstName').setValue('First Name');
    component.guestsFormArray.controls[3].get('lastName').setValue('Last Name');
    component.guestsFormArray.controls[4].get('firstName').setValue('   First Name');
    component.guestsFormArray.controls[4].get('lastName').setValue('   ');
    component.guestsFormArray.controls[5].get('firstName').setValue('   ');
    component.guestsFormArray.controls[5].get('lastName').setValue('   ');
    component.guestsFormArray.controls[0].markAsDirty();
    component.guestsFormArray.controls[1].markAsDirty();
    component.guestsFormArray.controls[2].markAsDirty();
    component.guestsFormArray.controls[3].markAsPristine();
    component.guestsFormArray.controls[4].markAsDirty();
    component.guestsFormArray.controls[5].markAsPristine();
    component.saveAdditionalGuestsNames();
    expect(addAdditionalGuestNames).toHaveBeenCalled();

    expect(component.guestsFormArray.controls[0].valid).toBeFalsy();
    expect(component.guestsFormArray.controls[0].get('firstName').hasError('pattern')).toBeTruthy();
    expect(component.guestsFormArray.controls[1].valid).toBeFalsy();
    expect(component.guestsFormArray.controls[1].hasError('firstNameRequired')).toBeFalsy();
    expect(component.guestsFormArray.controls[1].hasError('lastNameRequired')).toBeTruthy();
    expect(component.guestsFormArray.controls[2].valid).toBeFalsy();
    expect(component.guestsFormArray.controls[2].hasError('firstNameRequired')).toBeTruthy();
    expect(component.guestsFormArray.controls[2].hasError('lastNameRequired')).toBeFalsy();
    expect(component.guestsFormArray.controls[3].valid).toBeTruthy();
    expect(component.guestsFormArray.controls[3].hasError('firstNameRequired')).toBeFalsy();
    expect(component.guestsFormArray.controls[3].hasError('lastNameRequired')).toBeFalsy();
    expect(component.guestsFormArray.controls[4].valid).toBeFalsy();
    expect(component.guestsFormArray.controls[4].hasError('firstNameRequired')).toBeFalsy();
    expect(component.guestsFormArray.controls[4].hasError('lastNameRequired')).toBeTruthy();
    expect(component.guestsFormArray.controls[5].valid).toBeTruthy();
    expect(component.guestsFormArray.controls[5].hasError('firstNameRequired')).toBeFalsy();
    expect(component.guestsFormArray.controls[5].hasError('lastNameRequired')).toBeFalsy();
  });
  it('should set displayForm to false when Reward Night in China', () => {
    const reservation: Reservation =  new Reservation();
    reservation.rate.isRewardNight = true;
    reservation.rate.additionalGuestRestriction = new AdditionalGuestRestriction('AddBody', 'AddHeader');
    const hotel: Hotel = new Hotel();
    hotel.region = HotelRegion.GREATER_CHINA;
    hotel.brandCode = 'test';
    const mockState = <IAppState> {};
    mockState.reservation = reservation;
    mockState.hotel = hotel;
    spyOn(mockRedux, 'getState').and.returnValue(mockState);
    component.ngOnInit();
    expect(component.reservation).toBe(mockState.reservation);
    expect(component.displayForm).toBeFalsy();
  });
  it('should set displayForm to true when Reward Night in NO China region', () => {
    const reservation: Reservation =  new Reservation();
    reservation.rate.isRewardNight = true;
    const hotel: Hotel = new Hotel();
    hotel.region = HotelRegion.AMERICAS;
    hotel.brandCode = 'test';
    const mockState = <IAppState> {};
    mockState.reservation = reservation;
    mockState.hotel = hotel;
    spyOn(mockRedux, 'getState').and.returnValue(mockState);
    component.ngOnInit();
    expect(component.reservation).toBe(mockState.reservation);
    expect(component.displayForm).toBeTruthy();
  });
  it('should set displayForm to true when NO Reward Night in China region', () => {
    const reservation: Reservation =  new Reservation();
    reservation.rate.isRewardNight = false;
    const hotel: Hotel = new Hotel();
    hotel.region = HotelRegion.GREATER_CHINA;
    hotel.brandCode = 'test';
    const mockState = <IAppState> {};
    mockState.reservation = reservation;
    mockState.hotel = hotel;
    spyOn(mockRedux, 'getState').and.returnValue(mockState);
    component.ngOnInit();
    expect(component.reservation).toBe(mockState.reservation);
    expect(component.displayForm).toBeTruthy();
  });
  it('should set displayForm to true when NO Reward Night in NO China region', () => {
    const reservation: Reservation =  new Reservation();
    reservation.rate.isRewardNight = false;
    const hotel: Hotel = new Hotel();
    hotel.region = HotelRegion.EUROPE;
    hotel.brandCode = 'test';
    const mockState = <IAppState> {};
    mockState.reservation = reservation;
    mockState.hotel = hotel;
    spyOn(mockRedux, 'getState').and.returnValue(mockState);
    component.ngOnInit();
    expect(component.reservation).toBe(mockState.reservation);
    expect(component.displayForm).toBeTruthy();
  });


  it('should set displayForm to false when Free Night in China', () => {
    const reservation: Reservation =  new Reservation();
    reservation.rate.freeNight = true;
    reservation.rate.additionalGuestRestriction = new AdditionalGuestRestriction('AddBody', 'AddHeader');
    const hotel: Hotel = new Hotel();
    hotel.region = HotelRegion.GREATER_CHINA;
    hotel.brandCode = 'test';
    const mockState = <IAppState> {};
    mockState.reservation = reservation;
    mockState.hotel = hotel;
    spyOn(mockRedux, 'getState').and.returnValue(mockState);
    component.ngOnInit();
    expect(component.reservation).toBe(mockState.reservation);
    expect(component.displayForm).toBeFalsy();
  });
  it('should set displayForm to true when Free Night in NO China region', () => {
    const reservation: Reservation =  new Reservation();
    reservation.rate.freeNight = true;
    const hotel: Hotel = new Hotel();
    hotel.region = HotelRegion.AMERICAS;
    hotel.brandCode = 'test';
    const mockState = <IAppState> {};
    mockState.reservation = reservation;
    mockState.hotel = hotel;
    spyOn(mockRedux, 'getState').and.returnValue(mockState);
    component.ngOnInit();
    expect(component.reservation).toBe(mockState.reservation);
    expect(component.displayForm).toBeTruthy();
  });
  it('should set displayForm to true when NO Free Night in China region', () => {
    const reservation: Reservation =  new Reservation();
    reservation.rate.freeNight = false;
    const hotel: Hotel = new Hotel();
    hotel.region = HotelRegion.GREATER_CHINA;
    hotel.brandCode = 'test';
    const mockState = <IAppState> {};
    mockState.reservation = reservation;
    mockState.hotel = hotel;
    spyOn(mockRedux, 'getState').and.returnValue(mockState);
    component.ngOnInit();
    expect(component.reservation).toBe(mockState.reservation);
    expect(component.displayForm).toBeTruthy();
  });
  it('should set displayForm to true when NO Free Night in NO China region', () => {
    const reservation: Reservation =  new Reservation();
    reservation.rate.freeNight = false;
    const hotel: Hotel = new Hotel();
    hotel.region = HotelRegion.EUROPE;
    hotel.brandCode = 'test';
    const mockState = <IAppState> {};
    mockState.reservation = reservation;
    mockState.hotel = hotel;
    spyOn(mockRedux, 'getState').and.returnValue(mockState);
    component.ngOnInit();
    expect(component.reservation).toBe(mockState.reservation);
    expect(component.displayForm).toBeTruthy();
  });
});
