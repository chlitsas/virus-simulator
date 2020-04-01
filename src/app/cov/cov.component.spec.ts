import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CovComponent } from './cov.component';

describe('CovComponent', () => {
  let component: CovComponent;
  let fixture: ComponentFixture<CovComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CovComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CovComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
