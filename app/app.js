import {remote, clipboard} from 'electron';
const win = remote.getCurrentWindow();
import fs from 'graceful-fs';
import path from 'path';
import each from './each';
import Log from './log';
const log = new Log();
import watch from 'watch';
const ps = require('win-ps');
import {machineId} from 'electron-machine-id';
import state from './state';
import axios from 'axios';
import React from 'react';
import ReactDOMServer from 'react-dom/server'
/*if (process.env.NODE_ENV !== 'production') {
  const {whyDidYouUpdate} = require('why-did-you-update')
  whyDidYouUpdate(React)
}*/
import autoBind from 'react-autobind';
import Reflux from 'reflux';
import ReactMarkdown from 'react-markdown';
import ReactTooltip from 'react-tooltip';
import onClickOutside from 'react-onclickoutside';
import openExternal from 'open-external';
import _ from 'lodash';
import $ from 'jquery';
import v from 'vquery';
import moment from 'moment';
import math from 'mathjs';

import Loader from './loader';
const screenshot = require('./capture');
import * as utils from './utils';
window.utils = utils

import defaultWallpaper from './assets/images/default_wallpaper.png';
import baseIcon from './assets/images/base_icon.png';
import spaceStationIcon from './assets/images/spacestation_icon.png';

import {BasicDropdown, DropdownMenu, SaveEditorDropdownMenu, BaseDropdownMenu} from './dropdowns';
import GalacticMap from './map';

$.fn.scrollEnd = function(callback, timeout) {
  $(this).scroll(function(){
    var $this = $(this);
    if ($this.data('scrollTimeout')) {
      clearTimeout($this.data('scrollTimeout'));
    }
    $this.data('scrollTimeout', setTimeout(callback, timeout));
  });
};

const {dialog} = remote;

const IMAGE_DOMAIN = 'https://neuropuff.com';

class Button extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
    };
  }
  render(){
    return (
      <div
      className="ui segment Button__div"
      style={{
        left: '9px',
        letterSpacing: '3px',
        fontFamily: 'geosanslight-nmsregular',
        fontSize: '16px',
        padding: '3px 3px',
        textAlign: 'center',
        cursor: 'pointer'
      }}
      onClick={this.props.onClick}>
        {this.props.children}
      </div>
    );
  }
};

class ImageModal extends React.Component {
  constructor(props) {
    super(props);
    this.modalStyle = {
      background: 'rgb(23, 26, 22)',
      borderTop: '2px solid #95220E',
      position: 'fixed',
      left: '13%',
      top: '6%',
      zIndex: '1001',
      WebkitTransformOrigin: '50% 25%',
      boxShadow: 'none',
      border: '1px solid #DA2600',
      maxWidth: '75%'
    };
  }
  handleClickOutside(){
    state.set({selectedImage: null});
  }
  render(){
    return (
      <div className="ui fullscreen modal active" style={this.modalStyle}>
        <span className="close"/>
        <img className="image content" src={this.props.image} />
      </div>
    );
  }
};

ImageModal = onClickOutside(ImageModal);

class UsernameOverrideModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: ''
    };
    _.assignIn(this.state, _.pick(state.get(), ['ps4User']))
    this.modalStyle = {
      padding: '8px',
      textAlign: 'center',
      zIndex: '1001',
      WebkitTransformOrigin: '50% 25%',
      boxShadow: 'none',
      borderTop: '2px solid #95220E',
      border: '1px solid #DA2600',
      width: '400px'
    };
    this.inputStyle = {
      width: '300px',
      position: 'relative',
      top: '7px',
      color: '#FFF',
      background: 'rgb(23, 26, 22)',
      padding: '0.67861429em',
      borderRadius: '0px',
      border: '1px solid #DA2600',
      fontFamily: 'geosanslight-nmsregular',
      fontSize: '15px',
      letterSpacing: '2px'
    };
    autoBind(this);
  }
  handleClickOutside(){
    state.set({usernameOverride: false});
  }
  handleChange(e){
    this.setState({name: e.target.value})
  }
  handleSave(){
    if (this.props.ps4User) {
      state.set({username: this.state.name}, this.props.onRestart);
      return;
    }
    this.props.onSave(this.state.name)
  }
  render(){
    return (
      <div className="ui small modal active" style={this.modalStyle}>
        <span className="close"/>
        <input
        style={this.inputStyle}
        type="text"
        value={this.state.name}
        onChange={this.handleChange}
        maxLength={30}
        placeholder="Username" />
        <Button onClick={this.handleSave}>
          Save
        </Button>
      </div>
    );
  }
};

UsernameOverrideModal = onClickOutside(UsernameOverrideModal);

class LocationRegistrationModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      address: '',
      galaxies: [],
      galaxy: 0,
      selectedGalaxy: 0,
      preventClose: false
    };
    this.modalStyle = {
      padding: '8px',
      textAlign: 'center',
      zIndex: '1001',
      WebkitTransformOrigin: '50% 25%',
      boxShadow: 'none',
      borderTop: '2px solid #95220E',
      border: '1px solid #DA2600',
      width: '400px',
      height: '145px',
      position: 'absolute',
      left: '0px',
      right: '0px',
      top: '45%',
      margin: '0px auto'
    };
    this.inputStyle = {
      width: '300px',
      position: 'relative',
      top: '7px',
      color: '#FFF',
      background: 'rgb(23, 26, 22)',
      padding: '0.67861429em',
      borderRadius: '0px',
      border: '1px solid #DA2600',
      fontFamily: 'geosanslight-nmsregular',
      fontSize: '15px',
      letterSpacing: '2px'
    };
    this.errorStyle = {
      fontFamily: 'geosanslight-nmsregular',
      fontSize: '15px',
      fontWeight: 600,
      letterSpacing: '2px',
      color: 'rgb(218, 38, 0)'
    };
    autoBind(this);
  }
  componentDidMount(){
    each(state.galaxies, (galaxy, i)=>{
      this.state.galaxies.push({
        id: galaxy,
        label: galaxy,
        onClick: ()=>this.setState({
          galaxy: i,
          preventClose: false
        })
      });
    });
    this.setState({galaxies: this.state.galaxies});
  }
  handleClickOutside(){
    /*if (this.state.preventClose) {
      return;
    }*/
    state.set({registerLocation: false});
  }
  handleChange(e){
    this.setState({address: e.target.value})
  }
  handleSave(){
    let location = utils.fromHex(this.state.address, this.props.s.username, this.state.galaxy);
    if (!location) {
      this.setState({
        address: '',
        error: 'Invalid coordinate format.'
      });
      return;
    }

    let refLocation = _.findIndex(this.props.s.storedLocations, {translatedId: this.state.address});

    if (refLocation > -1) {
      this.setState({
        address: '',
        error: 'This location has already been registered.'
      });
      return;
    }

    this.props.s.storedLocations.push(location);
    each(this.props.s.storedLocations, (storedLocation, i)=>{
      if (_.isString(storedLocation.timeStamp)) {
        this.props.s.storedLocations[i].timeStamp = new Date(storedLocation.timeStamp).getTime()
      }
    });
    this.props.s.storedLocations = _.orderBy(this.props.s.storedLocations, 'timeStamp', 'desc');

    state.set({storedLocations: this.props.s.storedLocations}, ()=>{
      utils.ajax.post('/nmslocation/', {
        machineId: this.props.s.machineId,
        username: location.username,
        data: location
      }).then((res)=>{
        this.handleClickOutside();

      }).catch((err)=>{
        this.setState({
          address: '',
          error: 'There was an error registering this location.'
        });
      });
    });
  }
  render(){
    return (
      <div className="ui small modal active" style={this.modalStyle}>
        <span className="close"/>
        <div onClick={()=>this.setState({preventClose: true})}>
          <BasicDropdown
          height={this.props.s.height}
          options={this.state.galaxies}
          selectedGalaxy={this.state.galaxy} />
        </div>
        {this.state.error ? <div style={this.errorStyle}>{this.state.error}</div> : null}
        <div style={{position: 'absolute', top: '50px', left: '50px'}}>
          <input
          style={this.inputStyle}
          type="text"
          value={this.state.name}
          onChange={this.handleChange}
          maxLength={30}
          placeholder="Galactic Address" />
          <Button onClick={this.handleSave}>
            Save
          </Button>
        </div>
      </div>
    );
  }
};

LocationRegistrationModal = onClickOutside(LocationRegistrationModal);

const locationItemStyle = {padding: '0px 2px', margin: '0px 3px', background: 'rgba(23, 26, 22, 0.8)', fontFamily: 'geosanslight-nmsregular', fontSize: '16px'};

class Item extends React.Component {
  constructor(props) {
    super(props);
  }
  handleDescClick(e){
    e.preventDefault();
    openExternal(e.target.href);
  }
  componentDidMount(){
    if (this.props.label === 'Description') {
      _.defer(()=>{
        if (this.refs.desc) {
          this.refs.desc.addEventListener('click', this.handleDescClick);
        }
      });
    }
  }
  componentWillUnmount(){
    window.removeEventListener('resize', this.onWindowResize);
    if (this.refs.desc) {
      this.refs.desc.removeEventListener('click', this.handleDescClick);
    }
  }
  render(){
    if (this.props.label === 'Description') {
      return (
        <div
        ref="desc"
        className="Item__wrapperStyle"
        style={locationItemStyle}>
          <ReactMarkdown className="md-p" source={this.props.value} />
        </div>
      );
    } else {
      return (
        <div
        className="Item__wrapperStyle"
        style={locationItemStyle}>
          <span className="Item__labelStyle">{`${this.props.label}`}</span> <span className="Item__valueStyle">{this.props.value}</span>
        </div>
      );
    }
  }
};

class LocationBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: '',
      limit: false,
      name: this.props.name,
      description: this.props.description,
      image: null
    };
    autoBind(this);
  }
  handleCancel(){
    this.props.onEdit();
  }
  componentDidMount(){
    if (this.props.image) {
      let img = this.props.image
        .replace(/:/g, '~')
        .replace(/NMSLocation-/, '');
      let file = path.resolve(`${this.props.configDir}${img}`)
      if (!fs.existsSync(file)) {
        axios.get(`${IMAGE_DOMAIN}${this.props.image}`, {
          responseType: 'arraybuffer'
        }).then((res)=>{
          fs.writeFile(file, new Buffer.from(res.data, 'binary'), {flag: 'w'}, (err, data)=>{
            if (!err) {
              this.setState({image: `${file}`});
            } else {
              log.error(err)
            }
          });
        }).catch(()=>{});
      } else {
        this.setState({image: `${file}`});
      }
    }
  }
  componentWillReceiveProps(nextProps){
    if (nextProps.selectType && !_.isEqual(nextProps.location, this.props.location) && this.refs.scrollBox
      || nextProps.updating !== this.props.updating && nextProps.updating) {
      if (this.refs.scrollBox) {
        this.refs.scrollBox.scrollTop = 0;
      }

      this.setState({name: '', description: ''});
    }

    if (nextProps.name !== this.props.name) {
      this.setState({name: nextProps.name});
    }

    if (nextProps.description !== this.props.description) {
      this.setState({description: nextProps.description});
    }

    if (nextProps.compactRemote !== this.props.compactRemote && !nextProps.selectType) {
      ReactTooltip.rebuild();
      this.setState({compactRemote: nextProps.compactRemote}, this.props.onCompactRemoteSwitch);
    }
  }
  shouldComponentUpdate(nextProps, nextState){
    let bool = (!_.isEqual(nextProps.location, this.props.location)
      || nextProps.favorites !== this.props.favorites
      || nextProps.updating !== this.props.updating
      || nextProps.enableVisibilityCheck !== this.props.enableVisibilityCheck
      || nextProps.selectType === true
      || nextProps.isVisible !== this.props.isVisible
      || nextProps.scrollTop !== this.props.scrollTop
      || nextProps.compactRemote !== this.props.compactRemote && nextState.isVisible
      || nextState.image !== this.state.image);
    if (!_.isBoolean(bool)) { // TBD
      return true;
    }
    return bool;
  }
  handleNameChange(e){
    this.setState({name: e.target.value})
  }
  handleDescriptionChange(e){
    this.setState({description: e.target.value})
  }
  renderDetails(){
    let p = this.props;
    let scrollBoxStyle = p.compactRemote ? {maxHeight: '500px'} : {};
    return (
      <div
        ref="scrollBox"
        style={scrollBoxStyle}
        className="LocationBox__scrollBoxStyle">
          {p.image && p.image.length > 0 ?
          <div style={{textAlign: 'center'}}>
            {this.state.image ?
            <img
            className="LocationBox__imageStyle"
            src={this.state.image}
            onClick={()=>state.set({selectedImage: this.state.image})} /> : null}
          </div> : null}
          {p.location.description ? <Item label="Description" value={p.location.description} /> : null }
          <Item label="Galactic Address" value={p.location.translatedId} />
          <Item label="Voxel Address" value={p.location.id} />
          {p.location.galaxy !== undefined ? <Item label="Galaxy" value={state.galaxies[p.location.galaxy]} /> : null}
          {p.location.distanceToCenter ? <Item label="Distance to Center" value={`${p.location.distanceToCenter.toFixed(3)} LY`} /> : null}
          <Item label="Jumps" value={p.location.jumps} />
          {p.location.mode ? <Item label="Mode" value={_.upperFirst(p.location.mode)} /> : null}
          {p.location.teleports ? <Item label="Teleports" value={p.location.teleports} /> : null}
          {p.location.score ? <Item label="Favorites" value={p.location.score} /> : null}
          {p.name.length > 0 || p.location.baseData ? <Item label="Explored by" value={p.location.username} /> : null}
          <Item label="Created" value={moment(p.location.timeStamp).format('MMMM D, Y')} />
          {p.location.mods && p.location.mods.length > 0 && !p.compactRemote ?
          <div
          className="ui segment"
          style={utils.css(locationItemStyle)}>
            <span style={{fontWeight: '600'}}>Mods Used ({p.location.mods.length})</span>:
            {_.map(p.location.mods, (mod, i)=>{
              return (
                <div
                key={i}
                className="ui segment"
                style={utils.css(locationItemStyle, {
                  marginTop: i === 0 ? '14px' : '0px',
                  marginBottom: '0px',
                  fontSize: '14px'
                })}>
                  {_.truncate(mod, {length: 43})}
                </div>
              );
            })}
          </div> : null}
        </div>
    );
  }
  render(){
    let p = this.props;
    let refFav = _.findIndex(p.favorites, (fav)=>{
      return fav === p.location.id;
    });
    let upvote = refFav !== -1 || location.update;
    let isOwnLocation = p.isOwnLocation && p.selectType && p.location.username === p.username;
    let deleteArg = p.location.image && p.location.image.length > 0;
    let compact = p.width && p.width <= 1212;
    let isSpaceStation = p.location.id[p.location.id.length - 1] === '0';
    let leftOptions = [];

    if (p.location.id !== p.currentLocation && !p.ps4User) {
      leftOptions.push({
        id: 'teleport',
        label: p.selectType && p.installing && p.installing === `tselected` || p.i && p.installing === `t${p.i}` ? 'Working...' : 'Teleport Here',
        onClick: ()=>p.onTeleport(p.location, p.selectType ? 'selected' : p.i)
      });
    }
    if (p.location.base && p.location.baseData) {
      leftOptions.push({
        id: 'storeBase',
        label: 'Store Base',
        onClick: ()=>p.onSaveBase(p.location.baseData)
      });
    }
    if (p.isOwnLocation && p.selectType && p.location.username === p.username) {
      leftOptions.push({
        id: 'edit',
        label: p.edit ? 'Cancel' : 'Edit Details',
        onClick: ()=>p.onEdit()
      });
    }
    if (isOwnLocation) {
      leftOptions.push({
        id: 'uploadScreen',
        label: 'Upload Screenshot',
        onClick: ()=>p.onUploadScreen()
      });
      if (deleteArg) {
        leftOptions.push({
          id: 'deleteScreen',
          label: 'Delete Screenshot',
          onClick: ()=>p.onDeleteScreen()
        });
      } else {
        let refLeftOption = _.findIndex(leftOptions, {id: 'deleteScreen'});
        _.pullAt(leftOptions, refLeftOption);
      }
    } else if (p.selectType && p.location.id !== p.currentLocation && p.isSelectedLocationRemovable) {
      leftOptions.push({
        id: 'removeStored',
        label: 'Remove From Storage',
        onClick: ()=>p.onRemoveStoredLocation()
      });
    }
    leftOptions.push({
      id: 'copyAddress',
      label: 'Copy Address to Clipboard',
      onClick: ()=>clipboard.writeText(p.location.translatedId)
    });

    let visibleStyle = {
      background: p.selectType ? 'rgba(23, 26, 22, 0.9)' : 'rgb(23, 26, 22)',
      display: 'inline-table',
      opacity: '1',
      borderTop: '2px solid #95220E',
      textAlign: 'left',
      marginTop: p.selectType ? '26px' : 'initial',
      marginBottom: '26px',
      marginRight: !p.selectType && p.i % 1 === 0 ? '26px' : 'initial',
      minWidth: `${compact ? 358 : 386}px`,
      maxWidth: '386px',
      minHeight: p.compactRemote ? '68px' : '245px',
      maxHeight: '289px',
      zIndex: p.selectType ? '91' : 'inherit',
      position: p.selectType ? 'fixed' : '',
      left: p.selectType ? '28px' : 'inherit',
      top: p.selectType ? `${p.height - 271}px` : 'inherit',
      WebkitUserSelect: 'none'
    };

    return (
      <div
      className="ui segment"
      style={visibleStyle}
      data-place="left"
      data-tip={this.props.isVisible && !p.selectType && p.compactRemote ? ReactDOMServer.renderToString(this.renderDetails()) : null}>
        {this.props.isVisible ?
        <h3 style={{
          textAlign: 'center',
          maxHeight: '23px',
          color:  p.location.playerPosition && !p.location.manuallyEntered ? 'inherit' : '#7fa0ff',
          cursor: p.selectType ? 'default' : 'pointer'
        }}
        onClick={()=>state.set({selectedLocation: p.location, selectedGalaxy: p.location.galaxy})}>
          {p.edit && this.state.name.length > 0 ? this.state.name : p.location.username ? p.name.length > 0 ? p.name : `${p.location.username} explored` : 'Selected'}
        </h3> : null}

        {this.props.isVisible ?
        <i
        className={`${upvote ? '' : 'empty '}star icon LocationBox__starStyle`}
        onClick={()=>p.onFav(p.location)} /> : null}
        {this.props.isVisible ?
        <div style={{
          position: 'absolute',
          left: '17px',
          right: compact ? '143px' : 'initial',
          top: '16px'
        }}>
          {leftOptions.length > 0 ?
          <BasicDropdown
          icon="ellipsis horizontal"
          showValue={null}
          persist={p.edit}
          options={leftOptions} /> : null}
          {p.location.base ?
          <span data-tip={utils.tip('Base')} style={{position: 'absolute', left: `${leftOptions.length > 0 ? 26 : 0}px`, top: '0px'}}>
            <img className="LocationBox__baseStyle" src={baseIcon} />
          </span> : null}
          {isSpaceStation ?
          <span data-tip={utils.tip('Space Station')} style={{position: 'absolute', left: `${leftOptions.length > 0 ? 26 : 0}px`, top: '0px'}}>
            <img className="LocationBox__baseStyle" src={spaceStationIcon} />
          </span> : null}
        </div> : null}
        {p.edit && this.props.isVisible ?
        <div>
          <div
          className="ui segment"
          className="LocationBox__uiSegmentEditStyle">
            <div className="ui input" style={{width: '200px'}}>
              <div className="row">
                <input
                className="LocationBox__inputStyle"
                type="text"
                value={this.state.name}
                onChange={this.handleNameChange}
                maxLength={30}
                placeholder="Name" />
              </div>
            </div>
            <div className="ui input" style={{width: '200px'}}>
              <div className="row">
                <textarea
                className="LocationBox__textareaStyle"
                type="text"
                value={this.state.description}
                onChange={this.handleDescriptionChange}
                maxLength={200}
                placeholder="Description... (200 character limit)" />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-6">
              <Button onClick={()=>p.onSubmit(this.state.name, this.state.description)}>
                {p.updating ? 'Updating...' : this.state.limit ? `Limit exceeded (${this.state.description.length} characters)` : 'Update Location'}
              </Button>
            </div>
          </div>
        </div>
        : p.selectType || this.props.isVisible && !p.compactRemote ?
        <div>
          {this.renderDetails()}
        </div> : null}
      </div>

    );
  }
};

LocationBox.defaultProps = {
  selectType: false,
  name: '',
  description: ''
};

class RemoteLocations extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      init: true
    };
    autoBind(this);
    this.range = {start: 0, length: 0};
  }
  componentDidMount(){
    this.uiSegmentStyle = {
      background: 'rgba(23, 26, 22, 0.9)',
      display: 'inline-table',
      borderTop: '2px solid #95220E',
      textAlign: 'center',
      WebkitUserSelect: 'none',
      paddingRight: '0px'
    };
    let checkRemote = ()=>{
      if (this.props.s.remoteLocations && this.props.s.remoteLocations.results) {
        $(this.refs.recentExplorations).scrollEnd(this.scrollListener, 25);
        this.setState({init: false});
        this.setViewableRange(this.refs.recentExplorations);
      } else {
        _.delay(()=>checkRemote(), 500);
      }
    };
    checkRemote();
    this.throttledPagination = _.throttle(this.props.onPagination, 1000, {leading: true});
  }
  shouldComponentUpdate(nextProps) {
    return (nextProps.s.remoteLocations.results !== this.props.s.remoteLocations.results
      || this.props.s.search.length > 0
      || nextProps.s.searchCache.results !== this.props.s.searchCache.results
      || nextProps.s.favorites !== this.props.s.favorites
      || nextProps.updating !== this.props.updating
      || nextProps.s.installing !== this.props.s.installing
      || nextProps.s.width !== this.props.s.width
      || nextProps.s.remoteLocationsColumns !== this.props.s.remoteLocationsColumns
      || nextProps.s.compactRemote !== this.props.compactRemote
      || nextProps.s.showOnlyScreenshots !== this.props.s.showOnlyScreenshots
      || nextProps.s.showOnlyNames !== this.props.s.showOnlyNames
      || nextProps.s.showOnlyDesc !== this.props.s.showOnlyDesc
      || nextProps.s.showOnlyGalaxy !== this.props.s.showOnlyGalaxy
      || nextProps.s.showOnlyBases !== this.props.s.showOnlyBases
      || nextProps.s.showOnlyPC !== this.props.s.showOnlyPC
      || nextProps.s.selectedGalaxy !== this.props.s.selectedGalaxy
      || nextProps.s.sortByDistance !== this.props.s.sortByDistance
      || nextProps.s.sortByModded !== this.props.s.sortByModded
      || this.state.init)
  }
  componentWillReceiveProps(nextProps){
    let searchChanged = nextProps.s.searchCache.results !== this.props.s.searchCache.results;
    if (nextProps.s.sort !== this.props.s.sort && this.refs.recentExplorations || searchChanged) {
      this.refs.recentExplorations.scrollTop = 0;
    }

    if (nextProps.s.remoteLocationsColumns !== this.props.s.remoteLocationsColumns
      && this.refs.storedLocations) {
      this.setViewableRange(this.refs.recentExplorations);
    }
  }
  componentWillUnmount(){
    if (this.refs.recentExplorations) {
      this.refs.recentExplorations.removeEventListener('scroll', this.scrollListener);
    }
  }
  setViewableRange(node){
    if (!node) {
      return;
    }
    let itemHeight = this.props.s.compactRemote ? 68 : 245;
    this.range = utils.whichToShow({
      outerHeight: node.clientHeight,
      scrollTop: node.scrollTop,
      itemHeight: itemHeight + 26,
      columns: this.props.s.remoteLocationsColumns
    });
    this.forceUpdate();
  }
  scrollListener(){
    if (this.props.s.remoteLength >= this.props.s.remoteLocations.count - this.props.s.pageSize) {
      return;
    }

    let node = this.refs.recentExplorations;

    this.setViewableRange(node);

    if (this.props.s.searchCache.results.length > 0) {
      return;
    }

    if (node.scrollTop + window.innerHeight >= node.scrollHeight + node.offsetTop - 180) {
      this.throttledPagination(this.props.s.page);
      _.delay(()=>{
        this.refs.recentExplorations.scrollTop = Math.floor(node.scrollHeight - this.props.s.pageSize * 271);
      }, 1500);
    }
  }
  handleFavorite(location, upvote){
    this.props.onFav(location, upvote);
  }
  render(){
    let p = this.props;
    let remoteLocationsWidth;
    if (p.s.remoteLocationsColumns === 1) {
      remoteLocationsWidth = '441px';
    } else if (p.s.remoteLocationsColumns === 2) {
      remoteLocationsWidth = '902px';
    } else {
      remoteLocationsWidth = '1300px';
    }
    let containerStyle = {
      position: 'absolute',
      right: '54px',
      zIndex: '91',
      maxWidth: remoteLocationsWidth,
    };
    let uiSegmentsStyle = {
      display: 'inline-flex',
      paddingTop: '14px',
      width: '400px !important'
    };
    let innerContainerStyle = {
      maxHeight: `${p.s.height - 125}px`,
      width: remoteLocationsWidth,
      minWidth: '400px',
      maxWidth: remoteLocationsWidth,
      overflowY: 'auto',
      overflowX: 'hidden',
      position: 'relative'
    };

    let leftOptions = [
      {
        id: 'remoteLocationsColumns',
        label: `Max Columns: ${p.s.remoteLocationsColumns}`,
        onClick: ()=>state.set({remoteLocationsColumns: p.s.remoteLocationsColumns === 1 ? 2 : p.s.remoteLocationsColumns === 2 ? 3 : 1})
      },
      {
        id: 'compactRemote',
        label: `Compact View: ${p.s.compactRemote ? 'On' : 'Off'}`,
        onClick: ()=>state.set({compactRemote: !p.s.compactRemote})
      },
      {
        id: 'showOnlyGalaxy',
        label: this.props.s.showOnlyGalaxy ? 'Show Locations From All Galaxies' : `Show Only Locations From ${state.galaxies[p.s.selectedGalaxy]}`,
        onClick: ()=>state.set({showOnlyGalaxy: !this.props.s.showOnlyGalaxy})
      },
      {
        id: 'showOnlyPC',
        label: this.props.s.showOnlyPC ? 'Show Only PC Locations: On' : 'Show Only PC Locations: Off',
        onClick: ()=>state.set({showOnlyPC: !this.props.s.showOnlyPC})
      },
      {
        id: 'showOnlyScreenshots',
        label: this.props.s.showOnlyScreenshots ? 'Show Only Locations With Screenshots: On' : 'Show Only Locations With Screenshots: Off',
        onClick: ()=>state.set({showOnlyScreenshots: !this.props.s.showOnlyScreenshots})
      },
      {
        id: 'showOnlyNames',
        label: this.props.s.showOnlyNames ? 'Show Only Locations With Names: On' : 'Show Only Locations With Names: Off',
        onClick: ()=>state.set({showOnlyNames: !this.props.s.showOnlyNames})
      },
      {
        id: 'showOnlyDesc',
        label: this.props.s.showOnlyDesc ? 'Show Only Locations With Descriptions: On' : 'Show Only Locations With Descriptions: Off',
        onClick: ()=>state.set({showOnlyDesc: !this.props.s.showOnlyDesc})
      },
      {
        id: 'showOnlyBases',
        label: this.props.s.showOnlyBases ? 'Show Only Locations With Bases: On' : 'Show Only Locations With Bases: Off',
        onClick: ()=>state.set({showOnlyBases: !this.props.s.showOnlyBases})
      },
      {
        id: 'sortByDistance',
        label: this.props.s.sortByDistance ? 'Sort by Distance to Center: On' : 'Sort by Distance to Center: Off',
        onClick: ()=>state.set({sortByDistance: !this.props.s.sortByDistance})
      },
      {
        id: 'sortByModded',
        label: this.props.s.sortByModded ? 'Sort by Least Modded: On' : 'Sort by Least Modded: Off',
        onClick: ()=>state.set({sortByModded: !this.props.s.sortByModded})
      }
    ];
    if (p.s.remoteLocations && p.s.remoteLocations.results && p.s.searchCache.results.length === 0 && p.s.remoteLength < p.s.remoteLocations.count - p.s.pageSize) {
      leftOptions.push({
        id: 'loadMore',
        label: `Load ${p.s.pageSize} More Locations`,
        onClick: ()=>this.throttledPagination(p.s.page)
      });
    }
    let parenthesis = p.s.offline || p.s.remoteLength === 0 ? '' : `(${p.s.remoteLength})`;
    let criteria = p.s.offline ? 'Cached' : p.s.sort === '-created' ? 'Recent' : p.s.sort === '-score' ? 'Favorite' : 'Popular';
    let title = p.s.searchCache.results.length > 0 ? p.s.searchCache.count === 0 ? `No results for "${p.s.search}"` : `${p.s.search} (${p.s.searchCache.count})` : p.s.remoteLocations.count === 0 ? 'Loading...' : `${criteria} Explorations ${parenthesis}`
    let locations = p.s.searchCache.results.length > 0 ? p.s.searchCache.results : p.s.remoteLocations.results;
    if (this.props.s.showOnlyScreenshots) {
      locations = _.filter(locations, (location)=>{
        return location.image.length > 0;
      });
    }
    if (this.props.s.showOnlyNames) {
      locations = _.filter(locations, (location)=>{
        return location.data.name && location.data.name.length > 0;
      });
    }
    if (this.props.s.showOnlyDesc) {
      locations = _.filter(locations, (location)=>{
        return location.data.description && location.data.description.length > 0;
      });
    }
    if (this.props.s.showOnlyGalaxy) {
      locations = _.filter(locations, (location)=>{
        return location.data.galaxy === p.s.selectedGalaxy;
      });
    }
    if (this.props.s.showOnlyBases) {
      locations = _.filter(locations, (location)=>{
        return location.data.base;
      });
    }
    if (this.props.s.showOnlyPC) {
      locations = _.filter(locations, (location)=>{
        return location.data.playerPosition && !location.data.manuallyEntered;
      });
    }
    if (this.props.s.sortByDistance || this.state.sortByModded) {
      locations = _.orderBy(locations, (location)=>{
        if (!location.data.mods) {
          location.data.mods = [];
        }
        if (this.props.s.sortByModded && this.props.s.sortByDistance) {
          return location.data.mods.length + location.data.distanceToCenter;
        } else if (this.props.s.sortByDistance) {
          return location.data.distanceToCenter;
        } else if (this.props.s.sortByModded) {
          return location.data.mods.length;
        }
      });
    }
    let invisibleStyle = {
      height: `${(p.s.compactRemote ? 68 : 245) + 26}px`
    };

    return (
      <div className="columns" style={containerStyle}>
        <div className="ui segments" style={uiSegmentsStyle}>
          <div className="ui segment" style={this.uiSegmentStyle}>
            <h3>{title}</h3>
            <div style={{
              position: 'absolute',
              left: '17px',
              top: '16px'
            }}>
              <BasicDropdown
              icon="ellipsis horizontal"
              showValue={null}
              persist={true}
              options={leftOptions} />
            </div>
            <div
            style={innerContainerStyle}
            ref="recentExplorations">
              {_.map(locations, (location, i)=>{
                location.data.teleports = location.teleports;
                location.upvote = location.data.upvote;
                let isVisible = i >= this.range.start && i <= this.range.start + this.range.length;
                if (isVisible) {
                  return (
                    <LocationBox
                    key={location.id}
                    i={i}
                    scrollTop={this.refs.recentExplorations ? this.refs.recentExplorations.scrollTop : 0}
                    isVisible={true}
                    name={location.name}
                    description={location.description}
                    username={p.s.username}
                    isOwnLocation={p.isOwnLocation}
                    location={location.data}
                    installing={p.s.installing}
                    updating={p.updating}
                    favorites={p.s.favorites}
                    image={location.image}
                    onFav={this.handleFavorite}
                    onTeleport={p.onTeleport}
                    onSaveBase={p.onSaveBase}
                    onCompactRemoteSwitch={this.setViewableRange}
                    ps4User={p.ps4User}
                    compactRemote={p.s.compactRemote}
                    configDir={p.s.configDir}
                    />
                  );
                } else {
                  return (
                    <div
                    key={location.id}
                    style={invisibleStyle} />
                  );
                }
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class StoredLocationItem extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      hover: false
    };
    autoBind(this);
  }
  handleClick(){
    this.props.onClick(this.props.location, this.props.i);
  }
  render(){
    let uiSegmentStyle = {
      fontFamily: 'geosanslight-nmsregular',
      fontSize: '16px',
      fontWeight: this.props.location.upvote ? '600' : '400',
      cursor: 'pointer',
      padding: '3px 12px 3px 3px',
      background: this.state.hover || this.props.isSelected ? 'rgba(255, 255, 255, 0.1)' : 'inherit',
      textAlign: 'right',
      minHeight: '29px',
      maxHeight: '29px'
    };
    let usesName = this.props.location.name && this.props.location.name.length > 0;
    let idFormat = `${this.props.useGAFormat ? this.props.location.translatedId : this.props.location.id}${this.props.useGAFormat && this.props.location.PlanetIndex > 0 ? ' P' + this.props.location.PlanetIndex.toString() : ''}`
    let name = usesName ? this.props.location.name : idFormat;
    let isMarquee = (this.state.hover || this.props.isSelected) && name.length >= 25;
    name = isMarquee ? name : _.truncate(name, {length: 23});
    let isSpaceStation = this.props.location.id[this.props.location.id.length - 1] === '0';
    return (
      <div
      className="ui segment"
      style={uiSegmentStyle}
      onMouseEnter={()=>this.setState({hover: true})}
      onMouseLeave={()=>this.setState({hover: false})}
      onClick={this.handleClick}>
        {this.props.location.base ?
        <span data-tip={utils.tip('Base')} style={{position: 'absolute', left: `${this.props.location.upvote ? 31 : 4}px`, top: '4px'}}>
          <img style={{width: '21px', height: '21px'}} src={baseIcon} />
        </span> : null}
        {isSpaceStation ?
        <span data-tip={utils.tip('Space Station')} style={{position: 'absolute', left: `${this.props.location.upvote ? 31 : 4}px`, top: '3px'}}>
          <img style={{width: '21px', height: '21px'}} src={spaceStationIcon} />
        </span> : null}
        {this.props.location.upvote ?
        <i
        style={{
          position: 'absolute',
          top: '2px',
          left: '6px',
          cursor: 'pointer'
        }}
        className="star icon" /> : null}
        <p
        className={isMarquee ? 'marquee' : ''}
        style={{
          color: this.props.location.playerPosition && !this.props.location.manuallyEntered ? 'inherit' : '#7fa0ff',
          maxWidth: `${isMarquee ? 200 : 177}px`,
          whiteSpace: 'nowrap',
          position: 'relative',
          left: `${isMarquee ? 33 : name.length >= 25 ? 76 : !usesName && this.props.useGAFormat ? 56 : 86}px`,
        }}>
          <span>{name}</span>
        </p>
      </div>
    );
  }
}

class StoredLocations extends React.Component {
  constructor(props){
    super(props);
    autoBind(this);
    this.invisibleStyle = {
      height: '29px'
    };
    this.uiSegmentStyle = {
      background: 'rgba(23, 26, 22, 0.9)',
      display: 'inline-table',
      borderTop: '2px solid #95220E',
      minWidth: '285px',
      maxWidth: '285px',
      textAlign: 'center',
      paddingLeft: '0px',
      paddingRight: '0px',
      zIndex: '90'
    };
    this.range = {start: 0, length: 0};
  }
  componentDidMount(){
    let checkStored = ()=>{
      if (this.refs.storedLocations) {
        $(this.refs.storedLocations).scrollEnd(this.scrollListener, 25);
        this.setViewableRange(this.refs.storedLocations);
      } else {
        _.delay(()=>checkStored(), 500);
      }
    };
    checkStored();
  }
  shouldComponentUpdate(nextProps){
    return (nextProps.storedLocations !== this.props.storedLocations
      || nextProps.selectedLocationId !== this.props.selectedLocationId
      || nextProps.height !== this.props.height
      || nextProps.filterOthers !== this.props.filterOthers
      || nextProps.useGAFormat !== this.props.useGAFormat)
  }
  componentWillUnmount(){
    if (this.refs.storedLocations) {
      this.refs.storedLocations.removeEventListener('scroll', this.scrollListener);
    }
  }
  setViewableRange(node){
    if (!node) {
      return;
    }
    this.range = utils.whichToShow({
      outerHeight: node.clientHeight,
      scrollTop: node.scrollTop,
      itemHeight: 29,
      columns: 1
    });
    this.forceUpdate();
  }
  scrollListener(){
    this.setViewableRange(this.refs.storedLocations);
  }
  handleSelect(location, i){
    let hasSelectedId = this.props.selectedLocationId;
    this.props.onSelect(location);
    _.defer(()=>{
      if (location.id === this.props.selectedLocationId && !hasSelectedId) {
        this.refs.storedLocations.scrollTop = i * 29;
      }
    });
  }
  render(){
    let leftOptions = [
      {
        id: 'hideOthers',
        label: this.props.filterOthers ? 'Show All Locations' : 'Hide Others\' Locations',
        onClick: ()=>state.set({filterOthers: !this.props.filterOthers})
      },
      {
        id: 'sortTime',
        label: this.props.sortStoredByTime ? 'Sort by Favorites' : 'Sort Chronologically',
        onClick: ()=>state.set({sortStoredByTime: !this.props.sortStoredByTime})
      },
      {
        id: 'useGAFormat',
        label: this.props.useGAFormat ? 'Show Voxel Addresses' : 'Show Galactic Addresses',
        onClick: ()=>state.set({useGAFormat: !this.props.useGAFormat})
      }
    ];
    return (
      <div
        className="ui segment"
        style={{display: 'inline-flex', background: 'transparent', WebkitUserSelect: 'none'}}>
          <div className="ui segment" style={this.uiSegmentStyle}>
            <h3>{`Stored Locations (${this.props.storedLocations.length})`}</h3>
            <div style={{
              position: 'absolute',
              left: '17px',
              top: '16px'
            }}>
              <BasicDropdown
              icon="ellipsis horizontal"
              showValue={null}
              persist={true}
              options={leftOptions} />
            </div>
            <div
            ref="storedLocations"
            className="ui segments"
            style={{
              maxHeight: `${this.props.height - (this.props.selectedLocationId ? 404 : 125)}px`,
              //maxHeight: `${this.props.height - 125}px`,
              WebkitTransition: 'max-height 0.1s',
              overflowY: 'auto',
              overflowX: 'hidden'}}>
              {_.map(this.props.storedLocations, (location, i)=>{
                let isVisible = i >= this.range.start && i <= this.range.start + this.range.length;
                if (isVisible) {
                  return (
                    <StoredLocationItem
                    key={location.id}
                    ref={location.id}
                    i={i}
                    onClick={this.handleSelect}
                    isSelected={this.props.selectedLocationId === location.id}
                    location={location}
                    useGAFormat={this.props.useGAFormat}/>
                  );
                } else {
                  return (
                    <div
                    key={location.id}
                    style={this.invisibleStyle} />
                  );
                }
              })}
            </div>
          </div>
        </div>
    );
  }
}

class Container extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      updating: false,
      edit: false,
      mapRender: '<div />'
    };
    this.remotePollingFailures = 0;
    autoBind(this);
  }
  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.s.selectedLocation, this.props.s.selectedLocation)) {
      this.setState({edit: false});
    }
  }
  handleFavorite(location){
    if (this.props.s.offline) {
      state.set({error: `Unable to favorite location in offline mode.`});
      return;
    }
    let refFav = _.findIndex(this.props.s.favorites, (fav)=>{
      return fav === location.id;
    });
    let upvote = refFav === -1;

    utils.ajax.post('/nmslocation/', {
      machineId: this.props.s.machineId,
      username: this.props.s.username,
      score: location.score,
      upvote: upvote,
      id: location.id
    }).then((res)=>{
      let refLocation = _.findIndex(this.props.s.storedLocations, {id: location.id});
      if (refLocation !== -1) {
        this.props.s.storedLocations[refLocation].score = res.data.score;
        this.props.s.storedLocations[refLocation].upvote = upvote;
      }
      let refRemoteLocation = _.findIndex(this.props.s.remoteLocations.results, (location)=>{
        return location.data.id === location.id;
      });
      if (refRemoteLocation !== -1) {
        _.assignIn(this.props.s.remoteLocations.results[refRemoteLocation].data, {
          score: res.data.score,
          upvote: upvote,
        });
      }
      if (upvote) {
        this.props.s.favorites.push(location.id);
      } else {
        _.pullAt(this.props.s.favorites, refFav);
      }
      state.set({
        storedLocations: this.props.s.storedLocations,
        remoteLocations: this.props.s.remoteLocations,
        favorites: _.uniq(this.props.s.favorites)
      });
    }).catch((err)=>{
      log.error(`Failed to favorite remote location: ${err}`);
    });
  }
  handleUpdate(name, description){
    this.setState({updating: true}, ()=>{
      if (description.length > 200) {
        this.setState({limit: true});
        return;
      }
      const update = ()=>{
        let refLocation = _.findIndex(this.props.s.storedLocations, {id: this.props.s.selectedLocation.id});
        if (refLocation !== -1) {
          this.props.s.storedLocations[refLocation].name = name;
          this.props.s.storedLocations[refLocation].description = description;
        }
        let refRemoteLocation = _.findIndex(this.props.s.remoteLocations.results, (location)=>{
          return location.data.id === this.props.s.selectedLocation.id;
        });
        if (refRemoteLocation !== -1) {
          this.props.s.remoteLocations.results[refRemoteLocation].name = name;
          this.props.s.remoteLocations.results[refRemoteLocation].data.description = description;
          this.props.s.remoteLocations.results[refRemoteLocation].description = description;
        }
        this.props.s.selectedLocation.name = name;
        this.props.s.selectedLocation.description = description;
        state.set({
          storedLocations: this.props.s.storedLocations,
          remoteLocations: this.props.s.remoteLocations,
          selectedLocation: this.props.s.selectedLocation
        }, ()=>{
          this.setState({
            updating: false,
            edit: false
          });
        });
      };

      if (this.props.s.offline) {
        update();
        return;
      }

      utils.ajax.post('/nmslocation/', {
        machineId: this.props.s.machineId,
        username: this.props.s.username,
        name: name,
        description: description,
        id: this.props.s.selectedLocation.id
      }).then((res)=>{
        update();
      }).catch((err)=>{
        log.error(`Failed to update remote location: ${err}`);
      });
    });
  }
  handleUploadScreen(e){
    e.persist();
    if (this.props.s.offline) {
      state.set({error: `Unable to upload screenshot in offline mode.`});
      return;
    }
    this.setState({updating: true}, ()=>{
      var reader = new FileReader();
      reader.onload = (e)=> {
        var sourceImage = new Image();
        sourceImage.onload = ()=> {
          var imgWidth = sourceImage.width;
          var imgHeight = sourceImage.height;
          var canvas = document.createElement("canvas");
          canvas.width = imgWidth;
          canvas.height = imgHeight;
          canvas.getContext('2d').drawImage(sourceImage, 0, 0, imgWidth, imgHeight);
          var newDataUri = canvas.toDataURL('image/jpeg', 0.75);
          if (newDataUri) {
            utils.ajax.post('/nmslocation/', {
              machineId: this.props.s.machineId,
              username: this.props.s.username,
              imageU: newDataUri,
              id: this.props.s.selectedLocation.id
            }).then((res)=>{
              let refLocation = _.findIndex(this.props.s.storedLocations, {id: this.props.s.selectedLocation.id});
              if (refLocation !== -1) {
                this.props.s.storedLocations[refLocation].image = res.data.image;
              }
              let refRemoteLocation = _.findIndex(this.props.s.remoteLocations.results, (location)=>{
                return location.data.id === this.props.s.selectedLocation.id;
              });
              if (refRemoteLocation !== -1) {
                this.props.s.remoteLocations.results[refRemoteLocation].image = res.data.image;
              }
              this.props.s.selectedLocation.image = res.data.image;
              state.set({
                storedLocations: this.props.s.storedLocations,
                remoteLocations: this.props.s.remoteLocations,
                selectedLocation: this.props.s.selectedLocation
              }, ()=>{
                this.setState({
                  updating: false,
                  edit: false
                });
              });
            }).catch((err)=>{
              log.error(`Failed to upload screenshot: ${err}`);
            });
          }
        };
        sourceImage.src = reader.result;
        this.refs.uploadScreenshot.value = '';
      };
      reader.readAsDataURL(e.target.files[0]);
    });
  }
  handleDeleteScreen(){
    if (this.props.s.offline) {
      state.set({error: `Unable to delete screenshot in offline mode.`});
      return;
    }
    utils.ajax.post('/nmslocation/', {
      machineId: this.props.s.machineId,
      username: this.props.s.username,
      imageD: true,
      id: this.props.s.selectedLocation.id
    }).then((res)=>{
      let refLocation = _.findIndex(this.props.s.storedLocations, {id: this.props.s.selectedLocation.id});
      if (refLocation !== -1) {
        this.props.s.storedLocations[refLocation].image = res.data.image;
      }
      let refRemoteLocation = _.findIndex(this.props.s.remoteLocations.results, (location)=>{
        return location.data.id === this.props.s.selectedLocation.id;
      });
      if (refRemoteLocation !== -1) {
        this.props.s.remoteLocations.results[refRemoteLocation].image = res.data.image;
      }
      this.props.s.selectedLocation.image = '';
      state.set({
        storedLocations: this.props.s.storedLocations,
        remoteLocations: this.props.s.remoteLocations,
        selectedLocation: this.props.s.selectedLocation
      }, ()=>{
        this.setState({
          updating: false,
          edit: false
        });
      });
    });
  }
  handleSelectLocation(location){
    location = _.cloneDeep(location);
    let deselected = this.props.s.selectedLocation && this.props.s.selectedLocation.id === location.id;
    if (!deselected) {
      let refRemoteLocation = _.find(this.props.s.remoteLocations.results, (remoteLocation)=>{
        return remoteLocation.data.id === location.id;
      });

      if (refRemoteLocation !== undefined && refRemoteLocation) {
        let name = location.name;
        let description = location.description;

        refRemoteLocation.data.image = refRemoteLocation.image;
        _.assignIn(location, refRemoteLocation.data);

        location.name = name;
        location.description = description;
      }
    }
    state.set({
      selectedLocation: deselected ? null : location,
      selectedGalaxy: deselected ? 0 : location.galaxy
    });
  }
  render(){
    let p = this.props;
    let isOwnLocation = _.findIndex(p.s.storedLocations, {id: p.s.selectedLocation ? p.s.selectedLocation.id : null}) !== -1;
    let storedLocations = _.orderBy(p.s.storedLocations, (location)=>{
      return location.upvote !== undefined && location.upvote;
    }, 'desc');
    if (p.s.filterOthers) {
      storedLocations = _.filter(storedLocations, (location)=>{
        return location.username === p.s.username;
      });
    }
    if (p.s.sortStoredByTime) {
      storedLocations = _.orderBy(storedLocations, 'timeStamp', 'desc');
    }
    let isSelectedLocationRemovable = false;
    if (p.s.selectedLocation) {
      let refLocation = _.findIndex(p.s.storedLocations, {id: p.s.selectedLocation.id});
      isSelectedLocationRemovable = refLocation !== -1;
    }
    return (
      <div className="ui grid row" style={{paddingTop: '51px', float: 'left', position: 'absolute', margin: '0px auto', left: '0px', right: '0px'}}>
        <input ref="uploadScreenshot" onChange={this.handleUploadScreen} style={{display: 'none'}} type="file" accept="image/*" multiple={false} />
        <div className="columns">
          <div className="ui segments stackable grid container" style={{maxWidth: '800px !important'}}>
            <StoredLocations
            onSelect={this.handleSelectLocation}
            storedLocations={storedLocations}
            selectedLocationId={p.s.selectedLocation ? p.s.selectedLocation.id : null}
            height={p.s.height}
            filterOthers={p.s.filterOthers}
            sortStoredByTime={p.s.sortStoredByTime}
            useGAFormat={p.s.useGAFormat}
            username={p.s.username}/>
            <div className="ui segments" style={{display: 'inline-flex', paddingTop: '14px', marginLeft: '0px'}}>
              {p.s.remoteLocations && p.s.remoteLocations.results || p.s.searchCache.results.length > 0 ?
              <GalacticMap
              map3d={p.s.map3d}
              mapDrawDistance={p.s.mapDrawDistance}
              mapLines={p.s.mapLines}
              galaxyOptions={p.s.galaxyOptions}
              selectedGalaxy={p.s.selectedGalaxy}
              storedLocations={p.s.storedLocations}
              width={p.s.width}
              height={p.s.height}
              remoteLocationsColumns={p.s.remoteLocationsColumns}
              remoteLocations={p.s.remoteLocations}
              selectedLocation={p.s.selectedLocation}
              currentLocation={p.s.currentLocation}
              username={p.s.username}
              show={p.s.show}
              onRestart={p.onRestart}
              onSearch={p.onSearch} /> : <Loader />}
              {p.s.selectedLocation ?
              <LocationBox
              name={p.s.selectedLocation.name}
              description={p.s.selectedLocation.description}
              username={p.s.username}
              selectType={true}
              currentLocation={p.s.currentLocation}
              isOwnLocation={isOwnLocation}
              isVisible={true}
              location={p.s.selectedLocation}
              installing={p.s.installing}
              updating={this.state.updating}
              edit={this.state.edit}
              favorites={p.s.favorites}
              image={p.s.selectedLocation.image}
              width={p.s.width}
              height={p.s.height}
              isSelectedLocationRemovable={isSelectedLocationRemovable}
              onUploadScreen={()=>this.refs.uploadScreenshot.click()}
              onDeleteScreen={this.handleDeleteScreen}
              onFav={this.handleFavorite}
              onEdit={()=>this.setState({edit: !this.state.edit})}
              onRemoveStoredLocation={p.onRemoveStoredLocation}
              onTeleport={p.onTeleport}
              onSubmit={this.handleUpdate}
              onSaveBase={p.onSaveBase}
              ps4User={p.s.ps4User}
              configDir={p.s.configDir}
               /> : null}
            </div>
          </div>
        </div>
        {p.s.remoteLocations && p.s.remoteLocations.results || p.s.searchCache.results.length > 0 ?
        <RemoteLocations
        s={p.s}
        currentLocation={p.s.currentLocation}
        isOwnLocation={isOwnLocation}
        updating={this.state.updating}
        onPagination={p.onPagination}
        onTeleport={p.onTeleport}
        onFav={this.handleFavorite}
        onSaveBase={p.onSaveBase}
        ps4User={p.s.ps4User} /> : <Loader />}
      </div>
    );
  }
};

class App extends Reflux.Component {
  constructor(props) {
    super(props);

    this.state = {};
    this.store = state;
    autoBind(this);

    this.topAttachedMenuStyle = {
      position: 'absolute',
      maxHeight: '42px',
      zIndex: '99',
      WebkitUserSelect: 'none',
      WebkitAppRegion: 'drag'
    };
    this.titleStyle = {
      position: 'absolute',
      left: '16px',
      top: '5px',
      margin: 'initial',
      WebkitTransition: 'left 0.1s',
      textTransform: 'uppercase'
    };
    this.transparentIconInputStyle = {
      width: '250px',
      WebkitUserSelect: 'initial',
      WebkitAppRegion: 'no-drag',
      fontSize: '15px'
    };
    this.searchIconStyle = {
      cursor: 'default',
      padding: '0px'
    };
    this.titleBarControlsStyle = {
      WebkitAppRegion: 'no-drag',
      paddingRight: '0px'
    };
    this.noDragStyle = {
      WebkitAppRegion: 'no-drag'
    };
    this.letterSpacingStyle = {
      letterSpacing: '2px'
    };
    this.headerItemClasses = 'ui dropdown icon item';
  }
  componentDidMount(){
    window.addEventListener('resize', this.onWindowResize);
    log.init(this.state.configDir);
    log.error(`Initializing No Man's Connect ${this.state.version}`);
    if (this.state.offline) {
      log.error(`Offline mode enabled.`);
    }
    this.handleWorkers();
    window.handleWallpaper = this.handleWallpaper;
    this.dirSep = process.platform === 'win32' ? '\\' : '/';
    this.saveJSON = process.env.NODE_ENV === 'production' ? `.${this.dirSep}nmssavetool${this.dirSep}saveCache.json` : `.${this.dirSep}app${this.dirSep}nmssavetool${this.dirSep}saveCache.json`;
    this.saveTool = process.env.NODE_ENV === 'production' ? `${this.dirSep}nmssavetool${this.dirSep}nmssavetool.exe` : `${this.dirSep}app${this.dirSep}nmssavetool${this.dirSep}nmssavetool.exe`;
    this.whichCmd = `.${this.saveTool} decrypt -g ${this.state.mode} -o ${this.saveJSON}`;

    if (!this.state.offline) {
      window.ajaxWorker.postMessage({
        method: 'get',
        func: 'version',
        url: '/nmslocation',
        obj: {
          params: {
            version: true
          }
        }
      });
    }

    let initialize = ()=>{
      machineId().then((id)=>{
        this.pollSaveData(this.state.mode, true, id);
      }).catch((err)=>{
        log.error(err.message);
        this.pollSaveData(this.state.mode, true, null);
      });
    };

    let indexMods = ()=>{
      let letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'Y', 'X', 'Z'];
      let indexModsInUse = (_path, modPath)=>{
        fs.readFile(`${_path}\\Binaries\\SETTINGS\\TKGRAPHICSSETTINGS.MXML`, (err, data)=>{
          if (!err) {
            let fullscreen = data.toString().split('<Property name="FullScreen" value="')[1].substr(0, 4);
            if (fullscreen === 'true') {
              state.set({autoCapture: false});
            }
          }
          fs.readdir(`${_path}${modPath}`, (err, list)=>{
            if (err) {
              log.error(`Failed to read mods directory: ${err}`);
              return;
            }
            list = _.filter(list, (item)=>{
              return item.toLowerCase().indexOf('.pak') !== -1;
            });
            state.set({mods: list}, ()=>{
              initialize();
            });
          });
        });
      };

      let paths = [
        `/Program Files (x86)/GalaxyClient/Games/No Man's Sky`,
        `/Program Files (x86)/Steam/steamapps/common/No Man's Sky`,
        `/Steam/steamapps/common/No Man's Sky`,
        `/steamapps/common/No Man's Sky`,
        `/Program Files/No Man's Sky`,
        `/GOG Games/No Man's Sky`,
        `/Games/No Man's Sky`,
      ];

      if (this.state.installDirectory) {
        paths = [this.state.installDirectory.split(':\\')[1]];
      }

      let modPath = `\\GAMEDATA\\PCBANKS\\MODS`;

      let hasPath = false;
      each(letters, (drive, key)=>{
        each(paths, (_path)=>{
          let __path = `${drive}:${_path}`;
          if (fs.existsSync(__path)) {
            hasPath = true;
            indexModsInUse(__path, modPath);
            return;
          }
        });
      });
      if (!hasPath) {
        log.error('Failed to locate NMS install: path doesn\'t exist.')
        initialize();
      }
    };
    _.defer(indexMods);
  }
  componentDidUpdate(pP, pS){
    if (pS.search.length > 0 && this.state.search.length === 0 && this.state.searchInProgress) {
      this.handleClearSearch();
    }
  }
  handleWorkers(){
    window.ajaxWorker.onmessage = (e)=>{
      if (e.data.err) {
        state.set({init: false});
        if (!this.state.offline) {
          log.error(`AJAX Worker failure: ${e.data.func}`);
        }
        if (e.data.func === 'handleSync') {
          this.fetchRemoteLocations(e.data.params[0], e.data.params[1], e.data.params[2], true);
        } else if (e.data.func === 'pollRemoteLocations') {
          this.timeout = setTimeout(()=>this.pollRemoteLocations(), this.state.pollRate);
        }
        return;
      }
      console.log('AJAX WORKER: ', e.data);
      if (e.data.func === 'version') {
        if (e.data.data.version !== this.state.version) {
          this.handleUpgrade();
        }
      } else if (e.data.func === 'syncRemoteOwned') {
        each(e.data.results, (location, i)=>{
          _.assignIn(location.data, {
            name: location.name,
            description: location.description,
            teleports: location.teleports,
            score: location.score,
            image: location.image
          })
          e.data.data.results[i] = location;
        });
        this.state.storedLocations = _.chain(this.state.storedLocations).concat(_.map(e.data.data.results, 'data')).uniqBy('id').orderBy('timeStamp', 'desc').value();
        state.set({storedLocations: this.state.storedLocations});
      } else if (e.data.func === 'handleSync') {
        this.fetchRemoteLocations(e.data.params[0], e.data.params[1], e.data.params[2], true, true);
      } else if (e.data.func === 'fetchRemoteLocations') {
        this.formatRemoteLocations(e.data, e.data.params[0], e.data.params[1], e.data.params[2], e.data.params[2], e.data.params[3], ()=>{
          if (e.data.params[2]) { // init
            this.pollRemoteLocations(e.data.params[2]);
          }
        });
      } else if (e.data.func === 'pollRemoteLocations') {
        if (e.data.data.results.length > 0 && this.state.search.length === 0) {
          this.formatRemoteLocations(e.data, this.state.page, this.state.sort, false, false, false, ()=>{
            this.timeout = setTimeout(()=>this.pollRemoteLocations(), this.state.pollRate);
          });
        } else {
          this.timeout = setTimeout(()=>this.pollRemoteLocations(), this.state.pollRate);
        }
      }
    }
    window.formatWorker.onmessage = (e)=>{
      console.log('FORMAT WORKER: ', e.data);
      state.set(e.data.stateUpdate); // Sets init
    };
  }
  syncRemoteOwned(cb=null){
    if (this.state.offline) {
      return;
    }
    window.ajaxWorker.postMessage({
      method: 'get',
      func: 'syncRemoteOwned',
      url: '/nmslocationsync',
      obj: {
        params: {
          username: this.state.username,
          page_size: 9999
        }
      }
    });
    if (cb) {
      _.defer(cb);
    }
  }
  handleSync(page=1, sort=this.state.sort, init=false){
    if (this.state.offline) {
      return;
    }
    this.syncRemoteOwned(()=>{
      let locations = [];
      each(this.state.storedLocations, (location)=>{
        let existsInRemoteLocations = false;
        each(this.state.remoteLocations.results, (remoteLocation)=>{
          if (remoteLocation.data.id === location.id) {
            existsInRemoteLocations = true;
            return false;
          };
        });
        if (!existsInRemoteLocations) {
          location = _.cloneDeep(location);
          location.timeStamp = new Date(location.timeStamp);
          locations.push(location);
        }
      });
      window.ajaxWorker.postMessage({
        method: 'post',
        func: 'handleSync',
        url: '/nmslocationremotesync/',
        obj: {
          locations: locations,
          mode: this.state.mode,
          username: this.state.username,
        },
        params: [page, sort, init]
      });
    });
  }
  formatRemoteLocations(res, page, sort, init, partial, sync, cb=null){
    if (this.state.offline) {
      return;
    }
    if (!this.state.remoteLocations || this.state.remoteLocations.length === 0) {
      this.state.remoteLocations = {
        results: []
      };
    }

    window.formatWorker.postMessage({
      res: res,
      page: page,
      sort: sort,
      init: init,
      partial: partial,
      sync: sync,
      state: {
        remoteLocations: this.state.remoteLocations,
        search: this.state.search,
        sort: this.state.sort,
        favorites: this.state.favorites,
        storedLocations: this.state.storedLocations,
        pageSize: this.state.pageSize
      }
    });

    if (cb) {
      _.defer(cb);
    }
  }
  pollRemoteLocations(init=false){
    if (this.timeout)  {
      clearTimeout(this.timeout);
    }

    if (this.state.offline) {
      return;
    }

    if (this.state.sort !== '-created' || this.state.remoteLocations.results.length === 0 || init) {
      this.timeout = setTimeout(()=>this.pollRemoteLocations(), this.state.pollRate);
      return;
    }

    let lastRemoteLocation = _.chain(this.state.remoteLocations.results).orderBy('created', 'desc').first().value();

    let start = new Date(lastRemoteLocation.created);
    let end = new Date();

    window.ajaxWorker.postMessage({
      method: 'get',
      func: 'pollRemoteLocations',
      url: '/nmslocationpoll',
      obj: {
        params: {
          start: start,
          end: end,
          id: lastRemoteLocation.data.id
        }
      },
      params: [this.state.page, this.state.sort]
    });
  }
  fetchRemoteLocations(page=this.state.page, sort=this.state.sort, init=false, sync=false){
    if (this.state.offline) {
      return;
    }
    let q = this.state.search.length > 0 ? this.state.search : null;
    let path = q ? '/nmslocationsearch' : '/nmslocation';
    sort = sort === 'search' ? '-created' : sort;

    let workerParams = {
      method: 'get',
      func: 'fetchRemoteLocations',
      url: path,
      obj: {
        params: {
          page: page,
          sort: sort,
          q: q
        }
      },
      params: [page, sort, init, sync]
    };

    window.ajaxWorker.postMessage(workerParams);
  }
  handleCheat(id, n){
    let currentLocation = _.find(this.state.storedLocations, {id: this.state.currentLocation});
    if (currentLocation) {
      this.handleTeleport(currentLocation, 0, id, n);
    }
  }
  baseError(){
    dialog.showMessageBox({
      type: 'info',
      buttons: [],
      title: 'Base Save',
      message: 'Unable to save your base. Have you claimed a base yet?'
    });
  }
  handleSaveBase(baseData=null){
    if (baseData) {
      this.state.storedBases.push(_.cloneDeep(baseData));
      state.set({storedBases: this.state.storedBases});
      return;
    }
    utils.getLastGameModeSave(this.state.saveDirectory, this.state.mode, this.state.ps4User, log).then((saveData)=>{
      let base = utils.formatBase(saveData, state.knownProducts);
      let refBase = _.findIndex(this.state.storedBases, {Name: base.Name});
      if (refBase === -1) {
        this.state.storedBases.push(base);
      }
      state.set({storedBases: this.state.storedBases});
    }).catch(()=>{
      this.baseError();
    });
  }
  signSaveData(){
    let absoluteSaveDir = this.state.saveFileName.split(this.dirSep);
    _.pullAt(absoluteSaveDir, absoluteSaveDir.length - 1);
    absoluteSaveDir = absoluteSaveDir.join(this.dirSep);
    let command = `${process.platform !== 'win32' ? 'wine ' : ''}.${this.saveTool} encrypt -g ${this.state.mode} -i ${this.saveJSON} -s ${absoluteSaveDir}`;
    console.log(command);
    utils.exc(command, (res)=>{
      console.log(res);
      console.log('sucess');
    }).catch((e)=>{
      if (process.platform !== 'win32') {
        log.error('Unable to re-encrypt the metadata file with nmssavetool.exe. Do you have Wine with the Mono runtime installed?')
      }
      log.error(e.message);
    });
  }
  handleRestoreBase(base){
    utils.getLastGameModeSave(this.state.saveDirectory, this.state.mode, this.state.ps4User, log).then((saveData)=>{
      if (saveData.result.PlayerStateData.PersistentPlayerBases.length === 0) {
        this.baseError();
        return;
      }
      let newBase = saveData.result.PlayerStateData.PersistentPlayerBases[0];
      let storedBase = _.cloneDeep(base);

      // Base conversion algorithm by monkeyman192

      // 3-vector
      let fwdOriginal = storedBase.Forward;
      // 3-vector
      let upOriginal = storedBase.Objects[0].Up;
      // cross is defined in the math.js library.
      let perpOriginal = math.cross(fwdOriginal, upOriginal);

      // This creates  3rd vector orthogonal to the previous 2 to create a set of linearly independent basis vectors
      // this is a matrix made up from the other 3 vectors as columns
      let P = math.matrix([[fwdOriginal[0], upOriginal[0], perpOriginal[0]],
        [fwdOriginal[1], upOriginal[1], perpOriginal[1]],
        [fwdOriginal[2], upOriginal[2], perpOriginal[2]]]);

      // now read the new data, ensuring the user has created at least one Object to read data from (need that Up value!)
      // 3-vector
      let fwdNew = newBase.Forward;
      // 3-vector
      let upNew;
      if (newBase.Objects.length > 0) {
        upNew = newBase.Objects[0].Up;
      } else {
        dialog.showMessageBox({
          type: 'info',
          buttons: [],
          title: 'Base Restore',
          message: 'In order to restore your base correctly, at least one base building object must be placed on the new base first.'
        });
        return;
      }
      let perpNew = math.cross(fwdNew, upNew);

      // again, we construct a matrix from the column vectors:
      let Q = math.matrix([[fwdNew[0], upNew[0], perpNew[0]],
              [fwdNew[1], upNew[1], perpNew[1]],
              [fwdNew[2], upNew[2], perpNew[2]]]);

      // our final transform matrix is now equal to:
      let M = math.multiply(Q, math.inv(P))

      each(storedBase.Objects, (object, i)=>{
        storedBase.Objects[i].At = math.multiply(M, object.At)._data
        storedBase.Objects[i].Up = upNew;
        storedBase.Objects[i].Position = math.multiply(M, object.Position)._data;
      });

      saveData.result.PlayerStateData.PersistentPlayerBases[0].Objects = storedBase.Objects;

      fs.writeFile(this.saveJSON, JSON.stringify(saveData.result), {flag : 'w'}, (err, data)=>{
        if (err) {
          log.error(err);
          return;
        }
        this.signSaveData();
      });
    }).catch((err)=>{
      log.error(err);
    });
  }
  handleTeleport(location, i, action=null, n=null){
    const _location = _.cloneDeep(location);
    state.set({installing: `t${i}`}, ()=>{
      utils.getLastGameModeSave(this.state.saveDirectory, this.state.mode, this.state.ps4User, log).then((saveData)=>{

        if (location.data) {
          location = location.data;
        }

        if (location.manuallyEntered || !location.playerPosition) {
          _.assignIn(_location, {
            playerPosition: [
              233.02163696289063,
              6774.24560546875,
              115.99118041992188,
              1
            ],
            playerTransform: [
              0.35815203189849854,
              0.82056683301925659,
              0.44541805982589722,
              1
            ],
            shipPosition: [
              234.85250854492188,
              6777.2685546875,
              121.86365509033203,
              1
            ],
            shipTransform: [
              -0.48167002201080322,
              -0.84464621543884277,
              -0.23359590768814087,
              1
            ],
          });
          saveData.result.SpawnStateData.LastKnownPlayerState = 'InShip';
        }

        _.assignIn(saveData.result.SpawnStateData, {
          PlayerPositionInSystem: _location.playerPosition,
          PlayerTransformAt: _location.playerTransform,
          ShipPositionInSystem: _location.shipPosition,
          ShipTransformAt: _location.shipTransform
        });

        _.assignIn(saveData.result.PlayerStateData.UniverseAddress.GalacticAddress, {
          PlanetIndex: _location.PlanetIndex,
          SolarSystemIndex: _location.SolarSystemIndex,
          VoxelX: _location.VoxelX,
          VoxelY: _location.VoxelY,
          VoxelZ: _location.VoxelZ
        });

        if (action) {
          saveData.result = utils[action](saveData, n);
        }

        saveData.result.PlayerStateData.UniverseAddress.RealityIndex = _location.galaxy;

        fs.writeFile(this.saveJSON, JSON.stringify(saveData.result), {flag : 'w'}, (err, data)=>{
          if (err) {
            log.error(err);
          }
          this.signSaveData();
          let refStoredLocation = _.findIndex(this.state.storedLocations, {id: _location.id});
          if (refStoredLocation !== -1) {
            state.set({installing: false});
            return;
          }
          utils.ajax.post('/nmslocation/', {
            machineId: this.state.machineId,
            teleports: true,
            id: _location.id
          }).then((res)=>{
            let refRemoteLocation = _.findIndex(this.state.remoteLocations.results, (remoteLocation)=>{
              return remoteLocation.data.id === _location.id;
            });
            if (refRemoteLocation !== -1) {
              this.state.remoteLocations.results[refRemoteLocation] = res.data;
            }

            state.set({
              installing: false,
              currentLocation: _location.id,
              remoteLocations: this.state.remoteLocations
            });
          }).catch((err)=>{
            log.error(`Unable to send teleport stat to server: ${err}`);
            state.set({installing: false});
          });
        });
      }).catch((err)=>{
        log.error(err.message);
        log.error(`Unable to teleport to location: ${err}`);
      });
    });
  }
  pollSaveData(mode=this.state.mode, init=false, machineId=this.state.machineId){
    if (this.state.ps4User && this.state.username === 'Explorer') {
      state.set({usernameOverride: true});
      return;
    }

    let getLastSave = (NMSRunning=false)=>{
      let next = (error=false)=>{
        if (init && !this.state.ps4User) {
          this.handleWallpaper();
          this.handleSync(1, this.state.sort, init);

          watch.createMonitor(this.state.saveDirectory, {
            ignoreDotFiles: true,
            ignoreNotPermitted: true,

          }, (monitor)=>{
            this.monitor = monitor;
            this.pollSaveDataThrottled = _.throttle(this.pollSaveData, 15000, {leading: true});
            this.monitor.on('changed', (f, curr, prev)=>{
              this.pollSaveDataThrottled();
            });
          });
          if (this.state.username.toLowerCase() === 'explorer') {
            state.set({usernameOverride: true});
          }
        } else {
          if (init) {
            this.handleWallpaper();
          }
          this.fetchRemoteLocations(1, this.state.sort, init);
        }
      };

      if (mode && mode !== this.state.mode) {
        this.state.mode = mode;
      }

      let processData = (saveData, location, refLocation, username, profile=null)=>{
        if (this.state.ps4User) {
          state.set({
            machineId: machineId,
          }, next);
          return;
        }
        /*let uniquePlayers = [];
        each(saveData.result.DiscoveryManagerData['DiscoveryData-v1'].Store.Record, (record)=>{
          uniquePlayers.push(record.OWS.USN);
        });
        console.log(_.uniq(uniquePlayers))*/

        username = _.isString(username) && username.length > 0 ? username : '';

        let refFav = _.findIndex(this.state.favorites, (fav)=>{
          return fav === location.id;
        });
        let upvote = refFav !== -1;

        screenshot(!init && NMSRunning && this.state.autoCapture, (image)=>{
          if (refLocation === -1) {
            _.assignIn(location, {
              username: username,
              playerPosition: _.clone(saveData.result.SpawnStateData.PlayerPositionInSystem),
              playerTransform: _.clone(saveData.result.SpawnStateData.PlayerTransformAt),
              shipPosition: _.clone(saveData.result.SpawnStateData.ShipPositionInSystem),
              shipTransform: _.clone(saveData.result.SpawnStateData.ShipTransformAt),
              galaxy: _.clone(saveData.result.PlayerStateData.UniverseAddress.RealityIndex),
              distanceToCenter: Math.sqrt(Math.pow(location.VoxelX, 2) + Math.pow(location.VoxelY, 2) + Math.pow(location.VoxelZ, 2)) * 100,
              translatedX: utils.convertInteger(location.VoxelX, 'x'),
              translatedZ: utils.convertInteger(location.VoxelZ, 'z'),
              translatedY: utils.convertInteger(location.VoxelY, 'y'),
              base: false,
              baseData: null,
              upvote: upvote,
              image: image,
              mods: this.state.mods,
              manuallyEntered: false,
              timeStamp: Date.now(),
            });

            location.jumps = Math.ceil(location.distanceToCenter / 400);

            location.translatedId = `${utils.toHex(location.translatedX, 4)}:${utils.toHex(location.translatedY, 4)}:${utils.toHex(location.translatedZ, 4)}:${utils.toHex(location.SolarSystemIndex, 4)}`;

            if (location.translatedId.toLowerCase().indexOf('nan') !== -1) {
              log.error(`translatedId formatting is NaN: ${location}`);
              state.set({username: location.username}, ()=>{
                next();
              });
              return;
            }
            if (!location.playerPosition) {
              location.manuallyEntered = true;
            }
            this.state.storedLocations.push(location);
          }

          // Detect player base

          let base = null;
          let refBase = _.find(saveData.result.PlayerStateData.TeleportEndpoints, {TeleporterType: 'Base'});
          let baseFound = refBase !== undefined && refBase
          if (baseFound) {
            base = utils.formatID(refBase.UniverseAddress);
          }

          each(this.state.storedLocations, (storedLocation, i)=>{
            if (_.isString(storedLocation.timeStamp)) {
              this.state.storedLocations[i].timeStamp = new Date(storedLocation.timeStamp).getTime()
            }
            if (storedLocation.manuallyEntered === undefined && !storedLocation.playerPosition) { // For old locations
              storedLocation.manuallyEntered = true;
            }
            if (baseFound) {
              let hasBase = (base.VoxelX === storedLocation.VoxelX
                && base.VoxelY === storedLocation.VoxelY
                && base.VoxelZ === storedLocation.VoxelZ
                && base.SolarSystemIndex === storedLocation.SolarSystemIndex
                && base.PlanetIndex === storedLocation.PlanetIndex
                && refBase.UniverseAddress.RealityIndex === storedLocation.galaxy);
              this.state.storedLocations[i].base = hasBase;
              if (hasBase) {
                this.state.storedLocations[i].baseData = utils.formatBase(saveData, state.knownProducts);
              }
            }
          });
          this.state.storedLocations = _.orderBy(this.state.storedLocations, 'timeStamp', 'desc');

          let stateUpdate = {
            storedLocations: this.state.storedLocations,
            currentLocation: location.id,
            username: username,
            saveDirectory: this.state.saveDirectory,
            saveFileName: saveData.path,
            machineId: machineId
          };

          if (profile) {
            stateUpdate.profile = profile.data;
          }

          if (init) {
            log.error(`Username: ${stateUpdate.username}`);
            log.error(`Active save file: ${stateUpdate.saveFileName}`);
            log.error(`Current location: ${stateUpdate.currentLocation}`);
          }

          state.set(stateUpdate, ()=>{
            if (refLocation === -1) {
              utils.ajax.post('/nmslocation/', {
                machineId: this.state.machineId,
                username: location.username,
                mode: this.state.mode,
                image: image,
                data: location
              }).then((res)=>{
                next(false);
              }).catch((err)=>{
                next([err, err.message, err.stack]);
              });
            } else {
              next('exists');
            }
          });
        });
      }

      console.log('SAVE DIRECTORY: ', this.state.saveDirectory)

      utils.getLastGameModeSave(this.state.saveDirectory, this.state.mode, this.state.ps4User, log).then((saveData)=>{
        let refLocation, location, username;
        if (!this.state.ps4User) {
          location = utils.formatID(saveData.result.PlayerStateData.UniverseAddress);
          refLocation = _.findIndex(this.state.storedLocations, {id: location.id});
          username = saveData.result.DiscoveryManagerData['DiscoveryData-v1'].Store.Record[0].OWS.USN;
        }

        if (username
          && _.isString(username)
          && username.length > 0
          && this.state.username.length > 0
          && this.state.username !== username) {
          username = this.state.username;
        }

        console.log('USERNAME: ', username)

        if (this.state.offline) {
          processData(saveData, location, refLocation, username);
        } else {
          utils.ajax.get('/nmsprofile', {
            params: {
              username: username,
              machineId: machineId
            }
          }).then((profile)=>{
            if (typeof profile.data.username !== 'undefined') {
              username = profile.data.username;
            }
            processData(saveData, location, refLocation, username, profile);
          }).catch((err)=>{
            log.error(err)
            if (err.response && err.response.status === 403) {
              log.error(`Username protected: ${username}`);
              this.handleProtectedSession(username);
            } else {
              processData(saveData, location, refLocation, username);
            }
          });
        }

      }).catch((err)=>{
        log.error(err);
        log.error(`Unable to retrieve NMS save file: ${err}`)
        log.error(`${this.state.saveDirectory}, ${this.state.saveFileName}`);
        try {
          log.error(err.stack)
        } catch (e) {}

        this.handleSaveDataFailure(mode, init, ()=>{
          this.pollSaveData(mode, init);
        });
      });
    };

    if (process.platform !== 'win32' || parseFloat(this.state.winVersion) <= 6.1) {
      log.error(`Skipping process scan...`)
      getLastSave(false);
    } else {
      ps.snapshot(['ProcessName']).then((list) => {
        let NMSRunning = _.findIndex(list, {ProcessName: 'NMS.exe'}) !== -1;
        getLastSave(NMSRunning);
      }).catch((err)=>{
        log.error(`Unable to use win-ps: ${err}`);
        getLastSave(false);
      });
    }
  }
  handleProtectedSession(username){
    dialog.showMessageBox({
      title: `Protection Enabled For ${username}`,
      message: 'This username was protected by another user. When you protect your username, the app will associate your computer with your username to prevent impersonation. If this is in error, please open an issue on the Github repository.',
      buttons: ['OK', 'Open Issue']
    }, result=>{
      if (result === 1) {
        openExternal('https://github.com/jaszhix/NoMansConnect/issues');
        window.close();
      }
    });
  }
  handleUsernameOverride(username){
    if (username.length === 0) {
      dialog.showMessageBox({
        type: 'info',
        buttons: [],
        title: 'Username Override',
        message: 'Username field cannot be blank.'
      });
      return;
    }
    utils.ajax.post('/nmsoverride/', {
      username: this.state.username,
      override: username,
      machineId: this.state.machineId,
      ps4User: this.state.ps4User
    }).then((res)=>{
      window.jsonWorker.postMessage({
        method: 'remove',
        key: 'remoteLocations'
      });
      each(this.state.storedLocations, (location, i)=>{
        if (this.state.storedLocations[i].username === this.state.username) {
          this.state.storedLocations[i].username = username;
        }
      });
      state.set({
        storedLocations: this.state.storedLocations,
        username: username
      }, this.handleRestart);

    }).catch((err)=>{
      if (typeof err.response.data.status !== 'undefined' && err.response.data.status === 'protected') {
        dialog.showMessageBox({
          type: 'info',
          buttons: [],
          title: 'Username Protected',
          message: 'You must disable username protection before changing your username.'
        });
      }
    });
  }
  handleRemoveStoredLocation(){
    if (this.state.selectedLocation.id === this.state.currentLocation) {
      log.error('Failed to remove stored location: cannot remove the player\'s current location.');
      return;
    }
    let refStoredLocation = _.findIndex(this.state.storedLocations, {id: this.state.selectedLocation.id});
    _.pullAt(this.state.storedLocations, refStoredLocation);
    state.set({
      storedLocations: this.state.storedLocations,
      selectedLocation: null
    });
  }
  stateChange(e){
    this.setState(e);
  }
  onWindowResize(){
    state.set({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }
  handleSaveDataFailure(mode=this.state.mode, init=false, cb){
    dialog.showMessageBox({
      title: 'Which platform do you use?',
      message: 'Save data not found. Select PS4 to skip this step, and disable PC specific features.',
      buttons: ['PC', 'PS4']
    }, result=>{
      state.set({ps4User: result === 1}, ()=>{
        if (result === 0) {
          this.handleSelectSaveDirectory();
        } else if (this.state.username === 'Explorer') {
          state.set({usernameOverride: true});
        }
      });
    });
  }
  handleUpgrade(){
    log.error(`Newer version of NMC found.`);
    var infoUrl = 'https://github.com/jaszhix/NoMansConnect/releases';
    var helpMessage = 'A newer version of No Man\'s Connect was found.';

    _.defer(()=>{
      dialog.showMessageBox({
        title: 'No Man\'s Connect Upgrade',
        message: helpMessage,
        buttons: ['OK', 'Check releases']
      }, result=>{
        if (result === 1) {
          openExternal(infoUrl);
        } else {
          return;
        }
      });
    });
  }
  handleEnter(e){
    if (e.keyCode === 13) {
      this.handleSearch();
    }
  }
  handleSort(e, sort){
    sort = typeof sort === 'string' ? sort : '-created';
    state.set({sort: sort}, ()=>{
      this.fetchRemoteLocations(1, sort);
    });
  }
  handleSearch(){
    if (this.state.offline) {
      let searchCache = _.filter(this.state.remoteLocations.results, (location)=>{
        return (location.data.id === this.state.search
          || location.data.translatedId === this.state.search
          || location.username === this.state.search
          || location.name.indexOf(this.state.search) > -1
          || location.description.indexOf(this.state.search) > -1)
      });
      state.set({
        searchInProgress: true,
        searchCache: {
          results: searchCache,
          count: searchCache.length,
          next: null,
          prev: null
        }
      });
    } else {
      this.fetchRemoteLocations(1);
    }
  }
  handleClearSearch(){
    if (!this.state.offline) {
      let diff = [];
      each(this.state.searchCache.results, (location)=>{
        let refRemoteLocation = _.findIndex(this.state.remoteLocations.results, {id: location.id});
        if (refRemoteLocation === -1) {
          diff.push(location);
        }
      });
      this.state.remoteLocations.results = _.chain(this.state.remoteLocations.results)
        .concat(diff)
        .uniqBy((location)=>{
          return location.data.id;
        })
        .value();
    }

    state.set({
      search: '',
      searchCache: {
        results: [],
        count: 0,
        next: null,
        prev: null
      },
      remoteLocations: this.state.remoteLocations,
      searchInProgress: false,
      sort: '-created'
    }, ()=>{
      if (this.state.offline) {
        return;
      }

      window.jsonWorker.postMessage({
        method: 'get',
        key: 'remoteLocations'
      });
    })
  }
  handlePagination(){
    let page = this.state.page === 1 ? 2 : this.state.page + 1;
    state.set({page: page}, ()=>{
      this.fetchRemoteLocations(this.state.page);
    });
  }
  handleWallpaper(){
    let wallpaper = defaultWallpaper;
    if (this.state.wallpaper) {
      try {
        wallpaper = `data:${_.last(this.state.wallpaper.split('.'))};base64,${fs.readFileSync(this.state.wallpaper).toString('base64')}`;
      } catch (err) {
        log.error(`Unable to set wallpaper: ${err}`);
      }
    }
    v(document.body).css({
      backgroundImage: `url(${wallpaper})`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat'
    });
  }
  handleSetWallpaper(){
    if (this.state.wallpaper) {
      state.set({wallpaper: null}, ()=>{
        this.handleWallpaper();
      });
      return;
    }
    dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif']},],
    }, (cb)=>{
      if (cb && cb[0]) {
        state.set({
          wallpaper: cb[0]
        }, ()=>{
          this.handleWallpaper();
        });
      }
    });
  }
  handleSelectInstallDirectory(){
    dialog.showOpenDialog({properties: ['openDirectory']}, (cb)=>{
      if (cb && cb[0]) {
        state.set({
          installDirectory: cb[0]
        }, this.handleRestart);
      }
    });
  }
  handleSelectSaveDirectory(){
    dialog.showOpenDialog({properties: ['openDirectory']}, (cb)=>{
      if (cb && cb[0]) {
        state.set({
          saveDirectory: cb[0],
          title: 'No Man\'s Connect'
        }, this.handleRestart);
      }
    });
  }
  handleRestart(){
    _.delay(()=>{
      if (process.env.NODE_ENV === 'production') {
        remote.app.relaunch();
        window.close();
      } else {
        if (this.monitor) {
          this.monitor.stop();
        }
        window.location.reload();
      }
    }, 200);
  }
  handleMaximize(){
    state.set({maximized: !this.state.maximized}, ()=>{
      if (this.state.maximized) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    });
  }
  handleMinimize(){
    win.minimize();
  }
  handleClose(){
    win.close();
  }
  handleSetSearchValue(e){
    state.set({search: e.target.value});
  }
  handleSearchIconClick(){
    if (this.state.searchInProgress) {
      this.handleClearSearch();
    } else {
      this.handleSearch();
    }
  }
  handleSetUsernameOverride(){
    state.set({usernameOverride: true})
  }
  handleLocationRegistrationToggle(){
    state.set({registerLocation: !this.state.registerLocation});
  }
  render(){
    var s = this.state;
    return (
      <div>
        <div className="ui top attached menu" style={this.topAttachedMenuStyle}>
          <h2 style={this.titleStyle}>{s.title}</h2>
          <div className="right menu">
            {!s.init && !s.offline ?
            <div
            style={this.noDragStyle}
            className={`${this.headerItemClasses}${s.sort === '-created' ? ' selected' : ''}`}
            onClick={this.handleSort}>
              Recent
            </div> : null}
            {!s.init && !s.offline ?
            <div
            style={this.noDragStyle}
            className={`${this.headerItemClasses}${s.sort === '-teleports' ? ' selected' : ''}`}
            onClick={(e)=>this.handleSort(e, '-teleports')}>
              Popular
            </div> : null}
            {!s.init  && !s.offline ?
            <div
            style={this.noDragStyle}
            className={`${this.headerItemClasses}${s.sort === '-score' ? ' selected' : ''}`}
            onClick={(e)=>this.handleSort(e, '-score')}>
              Favorites
            </div> : null}
            {!s.init ?
            <div className="item">
              <div
              className="ui transparent icon input"
              style={this.transparentIconInputStyle}>
                <input type="text" style={this.letterSpacingStyle} placeholder="Search..." value={s.search} onChange={this.handleSetSearchValue} onKeyDown={this.handleEnter}/>
                <i className={s.searchInProgress ? 'remove link icon' : 'search link icon'} style={this.searchIconStyle} onClick={this.handleSearchIconClick}/>
              </div>
            </div> : null}
            {!s.ps4User ?
            <BaseDropdownMenu
            onSaveBase={this.handleSaveBase}
            onRestoreBase={this.handleRestoreBase}
            baseOpen={s.baseOpen}
            baseIcon={baseIcon}
            storedBases={this.state.storedBases}
            /> : null}
            {s.profile && !s.ps4User ?
            <SaveEditorDropdownMenu
            onSaveBase={this.handleSaveBase}
            onRestoreBase={this.handleRestoreBase}
            profile={s.profile}
            editorOpen={s.editorOpen}
            onCheat={this.handleCheat}
            /> : null}
            <a
            style={utils.css(this.noDragStyle, {cursor: 'default'})}
            className={`ui icon item`}
            onClick={this.handleLocationRegistrationToggle}
            data-place="bottom"
            data-tip={utils.tip('Manually Register Location')}>
              <i className="location arrow icon" />
            </a>
            <DropdownMenu
            s={s}
            onSelectSaveDirectory={this.handleSelectSaveDirectory}
            onSelectInstallDirectory={this.handleSelectInstallDirectory}
            onRestart={this.handleRestart}
            onSync={this.handleSync}
            onSetWallpaper={this.handleSetWallpaper}
            onUsernameOverride={this.handleSetUsernameOverride} />
          </div>
          {process.platform === 'win32' ?
          <div
          style={this.titleBarControlsStyle}
          className={this.headerItemClasses}
          onClick={this.handleSort}>
            <div className="titlebar-controls">
              <div className="titlebar-minimize" onClick={this.handleMinimize}>
                <svg x="0px" y="0px" viewBox="0 0 10 1">
                  <rect fill="#FFFFFF" width="10" height="1"></rect>
                </svg>
              </div>
              <div className="titlebar-resize" onClick={this.handleMaximize}>
                {s.maximized ?
                <svg className="fullscreen-svg" x="0px" y="0px" viewBox="0 0 10 10">
                  <path fill="#FFFFFF" d="M 0 0 L 0 10 L 10 10 L 10 0 L 0 0 z M 1 1 L 9 1 L 9 9 L 1 9 L 1 1 z "/>
                </svg>
                :
                <svg className="maximize-svg" x="0px" y="0px" viewBox="0 0 10 10">
                  <mask id="Mask">
                    <path fill="#FFFFFF" d="M 3 1 L 9 1 L 9 7 L 8 7 L 8 2 L 3 2 L 3 1 z"/>
                    <path fill="#FFFFFF" d="M 1 3 L 7 3 L 7 9 L 1 9 L 1 3 z"/>
                  </mask>
                  <path fill="#FFFFFF" d="M 2 0 L 10 0 L 10 8 L 8 8 L 8 10 L 0 10 L 0 2 L 2 2 L 2 0 z" mask="url(#Mask)"/>
                </svg>}
              </div>
              <div className="titlebar-close" onClick={this.handleClose}>
                <svg x="0px" y="0px" viewBox="0 0 10 10">
                  <polygon fill="#FFFFFF" points="10,1 9,0 5,4 1,0 0,1 4,5 0,9 1,10 5,6 9,10 10,9 6,5"></polygon>
                </svg>
              </div>
            </div>
          </div> : null}
        </div>
        {this.state.selectedImage ? <ImageModal image={this.state.selectedImage} width={this.state.width} /> : null}
        {this.state.usernameOverride ? <UsernameOverrideModal ps4User={this.state.ps4User} onSave={this.handleUsernameOverride} onRestart={this.handleRestart}/> : null}
        {this.state.registerLocation ? <LocationRegistrationModal s={_.pick(this.state, ['machineId', 'username', 'height', 'storedLocations'])} /> : null}
        {s.init ?
        <Loader />
        :
        <Container
        s={s}
        onTeleport={this.handleTeleport}
        onPagination={this.handlePagination}
        onRemoveStoredLocation={this.handleRemoveStoredLocation}
        onSaveBase={this.handleSaveBase}
        onRestart={this.handleRestart}
        onSearch={this.handleSearch} />}
        <ReactTooltip
        className="nmcTip"
        globalEventOff="click mouseleave"
        effect="solid"
        place="bottom"
        multiline={true}
        html={true}
        offset={{top: 0, left: 6}}  />
      </div>
    );
  }
};

export default App;